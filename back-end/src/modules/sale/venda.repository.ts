import { prisma } from "../../shared/database/prisma";
import { Prisma } from "../../shared/database/generated/prisma/client";
import {
  IVendaRepository,
  CreateVendaDTO,
  VendaEntity,
  VendaFullDTO,
  PrismaTx,
  VendaFullDb,
  vendaInclude,
} from "./venda.dto";
import { RepositoryPaginatedResult } from "../../shared/dtos/index.dto";

// Tipos auxiliares para tipagem estrita nos maps
type RepoPayment = VendaFullDb["pagamento_venda"][number];
type RepoItem = VendaFullDb["item_venda"][number];

export class VendaRepository implements IVendaRepository {
  // --- Mappers ---

  private mapToEntity(row: Prisma.vendaGetPayload<object>): VendaEntity {
    return {
      id_venda: row.id_venda,
      id_loja: row.id_loja,
      id_caixa: row.id_caixa,

      // Ajuste: id_user agora pode ser string ou null (conforme seu novo schema)
      id_user: row.id_user,

      id_cliente: row.id_cliente,
      data: row.data,
      hora: row.hora,
      status: row.status || "PENDENTE",

      // REMOVIDO O CAST 'AS ANY': O Prisma já sabe que esse campo existe
      tipo_venda: row.tipo_venda || "FISICA",

      total_final: Number(row.total_final ?? 0),
      valor_pago: Number(row.valor_pago ?? 0),
      desconto: Number(row.desconto ?? 0),
      acrescimo: Number(row.acrescimo ?? 0),
      data_criacao: row.data_criacao,
      ultima_atualizacao: row.ultima_atualizacao,
    };
  }

  private mapToFullDTO(row: VendaFullDb): VendaFullDTO {
    const entity = this.mapToEntity(row);
    return {
      ...entity,
      nome_cliente: row.cliente?.nome || null,
      nome_vendedor: row.user?.email || null,

      pagamentos: row.pagamento_venda.map((p: RepoPayment) => ({
        id_pagamento: p.id_pagamento,
        id_venda: p.id_venda,
        tipo_pagamento: p.tipo_pagamento,
        valor: Number(p.valor),
      })),

      itens: row.item_venda.map((i: RepoItem) => ({
        id_item_venda: i.id_item_venda,
        id_venda: i.id_venda,
        id_variacao: i.id_variacao,
        quantidade: i.quantidade,
        preco_unitario: Number(i.preco_unitario),
        preco_final_unitario: Number(i.preco_final_unitario),
        preco_subtotal: Number(i.preco_subtotal),
        desconto_por_item: Number(i.desconto_por_item ?? 0),
        acrescimo_por_item: Number(i.acrescimo_por_item ?? 0),
        nome_produto: i.produto_variacao?.produto?.nome || "Produto Removido",
        referencia_produto: i.produto_variacao?.produto?.referencia || null,
        nome_variacao: i.produto_variacao?.nome || null,
      })),
    };
  }

  // --- Métodos de Leitura ---

  async findById(id: string): Promise<VendaFullDTO | null> {
    const row = await prisma.venda.findUnique({
      where: { id_venda: id },
      include: vendaInclude,
    });
    return row ? this.mapToFullDTO(row) : null;
  }

  async findPaginated(
    page: number,
    limit: number,
    id_loja?: string
  ): Promise<RepositoryPaginatedResult<VendaEntity>> {
    const skip = (page - 1) * limit;
    const where: Prisma.vendaWhereInput = id_loja ? { id_loja } : {};

    const [rows, total] = await Promise.all([
      prisma.venda.findMany({
        where,
        take: limit,
        skip,
        orderBy: { data_criacao: "desc" },
      }),
      prisma.venda.count({ where }),
    ]);

    return { data: rows.map(this.mapToEntity), total };
  }

  async searchPaginated(
    query: string,
    page: number,
    limit: number,
    id_loja?: string
  ): Promise<RepositoryPaginatedResult<VendaEntity>> {
    const skip = (page - 1) * limit;

    const where: Prisma.vendaWhereInput = {
      AND: [
        id_loja ? { id_loja } : {},
        {
          OR: [
            { cliente: { nome: { contains: query, mode: "insensitive" } } },
            { status: { contains: query.toUpperCase() } },

            // REMOVIDO O CAST 'AS ANY':
            // Se o generate rodou, vendaWhereInput tem a propriedade tipo_venda
            { tipo_venda: { contains: query.toUpperCase() } },
          ],
        },
      ],
    };

    const [rows, total] = await Promise.all([
      prisma.venda.findMany({
        where,
        take: limit,
        skip,
        orderBy: { data_criacao: "desc" },
      }),
      prisma.venda.count({ where }),
    ]);

    return { data: rows.map(this.mapToEntity), total };
  }

  // --- Métodos de Escrita ---

  async updateStatus(id: string, status: string): Promise<void> {
    await prisma.venda.update({
      where: { id_venda: id },
      data: { status, ultima_atualizacao: new Date() },
    });
  }

  async updateStatusWithTx(
    tx: PrismaTx,
    id: string,
    status: string
  ): Promise<void> {
    await tx.venda.update({
      where: { id_venda: id },
      data: { status, ultima_atualizacao: new Date() },
    });
  }

  async createWithTx(
    tx: PrismaTx,
    data: CreateVendaDTO,
    totalFinal: number
  ): Promise<VendaEntity> {
    const totalPago = data.pagamentos.reduce((acc, p) => acc + p.valor, 0);

    // Lógica de ID de Usuário (Pode ser Null)
    let idUserFinal: string | null = data.id_vendedor || data.actorUserId;

    // Se for online e sem vendedor definido, deixa null
    if (data.tipo_venda === "ONLINE" && !data.id_vendedor) {
      idUserFinal = null;
    }

    const venda = await tx.venda.create({
      data: {
        id_loja: data.id_loja,
        id_user: idUserFinal, // Aceita null agora
        id_caixa: data.id_caixa || null,
        id_cliente: data.id_cliente || null,
        desconto: data.desconto_global,
        acrescimo: data.acrescimo_global,
        status: data.status || "FINALIZADA",

        // REMOVIDO O SPREAD E O CAST: Atribuição direta
        tipo_venda: data.tipo_venda || "FISICA",

        total_final: totalFinal,
        valor_pago: totalPago,
        pagamento_venda: {
          create: data.pagamentos.map((p) => ({
            tipo_pagamento: p.tipo_pagamento,
            valor: p.valor,
          })),
        },
      },
    });

    return this.mapToEntity(venda);
  }
}
