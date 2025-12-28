import { prisma } from "../../shared/database/prisma";
import { Prisma } from "../../shared/database/generated/prisma/client";
import { isValidUUID } from "../../shared/utils/validation";
// ✅ Importamos o RepositoryPaginatedResult do shared para tipar o retorno
import { RepositoryPaginatedResult } from "../../shared/dtos/index.dto";
import {
  vendaInclude,
  VendaFullDTO,
  VendaEntity,
  VendaListDb,
} from "./venda.dto";

export class VendaRepository {
  // ===============================
  // HELPER PRIVADO (Converte Decimal do Prisma para Number da Entity)
  // ===============================
  private mapToEntity(v: VendaListDb): VendaEntity {
    const totalFinal = v.total_final.toNumber();
    const valorPago = v.valor_pago.toNumber();
    const troco = valorPago > totalFinal ? valorPago - totalFinal : 0;

    return {
      id_venda: v.id_venda,
      id_loja: v.id_loja,
      id_caixa: v.id_caixa,
      id_user: v.id_user,
      id_cliente: v.id_cliente,
      tipo_venda: v.tipo_venda || "FISICA",
      data: v.data,
      hora: v.hora,
      desconto: v.desconto ? v.desconto.toNumber() : 0,
      acrescimo: v.acrescimo ? v.acrescimo.toNumber() : 0,
      status: v.status || "PENDENTE",
      total_final: totalFinal,
      valor_pago: valorPago,
      troco: troco,
      data_criacao: v.data_criacao,
      ultima_atualizacao: v.ultima_atualizacao,
      nome_cliente: v.cliente?.nome || null,
    };
  }

  // ===============================
  // CREATE
  // ===============================
  async createWithTx(
    tx: Prisma.TransactionClient,
    data: {
      id_loja: string;
      id_caixa?: string | null;
      id_user?: string | null;
      id_cliente?: string | null;
      tipo_venda?: string;
      desconto?: number;
      acrescimo?: number;
      status: string;
      total_final: number;
      valor_pago: number;
    }
  ): Promise<VendaEntity> {
    const res = await tx.venda.create({
      data: {
        id_loja: data.id_loja,
        id_caixa: data.id_caixa ?? null,
        id_user: data.id_user ?? null,
        id_cliente: data.id_cliente ?? null,
        tipo_venda: data.tipo_venda ?? "FISICA",
        desconto: data.desconto ?? 0,
        acrescimo: data.acrescimo ?? 0,
        status: data.status,
        total_final: data.total_final,
        valor_pago: data.valor_pago,
      },
    });

    // Mapeamento manual para retornar VendaEntity sem usar any
    return {
      id_venda: res.id_venda,
      id_loja: res.id_loja,
      id_caixa: res.id_caixa,
      id_user: res.id_user,
      id_cliente: res.id_cliente,
      tipo_venda: res.tipo_venda || "FISICA",
      data: res.data,
      hora: res.hora,
      desconto: res.desconto ? res.desconto.toNumber() : 0,
      acrescimo: res.acrescimo ? res.acrescimo.toNumber() : 0,
      status: res.status || "PENDENTE",
      total_final: res.total_final.toNumber(),
      valor_pago: res.valor_pago.toNumber(),
      troco: 0,
      data_criacao: res.data_criacao,
      ultima_atualizacao: res.ultima_atualizacao,
    };
  }

  // ===============================
  // FIND BY ID (Detalhado)
  // ===============================
  async findById(id_venda: string): Promise<VendaFullDTO | null> {
    const venda = await prisma.venda.findUnique({
      where: { id_venda },
      include: vendaInclude, // ✅ TypeScript infere VendaFullDb aqui
    });

    if (!venda) return null;

    // ✅ MAPEAMENTO: Traz o nome do produto para o nível superior
    const itensFormatados = venda.item_venda.map((item) => {
      const produto = item.produto_variacao?.produto;
      const variacao = item.produto_variacao;

      return {
        id_item_venda: item.id_item_venda,
        id_venda: item.id_venda,
        id_variacao: item.id_variacao,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario.toNumber(),
        desconto_por_item: item.desconto_por_item
          ? item.desconto_por_item.toNumber()
          : 0,
        acrescimo_por_item: item.acrescimo_por_item
          ? item.acrescimo_por_item.toNumber()
          : 0,
        preco_final_unitario: item.preco_final_unitario.toNumber(),
        preco_subtotal: item.preco_subtotal.toNumber(),
        // Campos achatados para o front
        nome_produto: produto?.nome || "Produto Indisponível",
        referencia_produto: produto?.referencia || null,
        nome_variacao: variacao?.nome || null,
      };
    });

    const pagamentosFormatados = venda.pagamento_venda.map((p) => ({
      id_pagamento: p.id_pagamento,
      id_venda: p.id_venda,
      tipo_pagamento: p.tipo_pagamento,
      valor: p.valor.toNumber(),
    }));

    const totalFinal = venda.total_final.toNumber();
    const valorPago = venda.valor_pago.toNumber();
    const troco = valorPago > totalFinal ? valorPago - totalFinal : 0;

    return {
      id_venda: venda.id_venda,
      id_loja: venda.id_loja,
      id_caixa: venda.id_caixa,
      id_user: venda.id_user,
      id_cliente: venda.id_cliente,
      tipo_venda: venda.tipo_venda || "FISICA",
      data: venda.data,
      hora: venda.hora,
      desconto: venda.desconto ? venda.desconto.toNumber() : 0,
      acrescimo: venda.acrescimo ? venda.acrescimo.toNumber() : 0,
      status: venda.status || "PENDENTE",
      total_final: totalFinal,
      valor_pago: valorPago,
      troco: troco,
      data_criacao: venda.data_criacao,
      ultima_atualizacao: venda.ultima_atualizacao,
      itens: itensFormatados,
      pagamentos: pagamentosFormatados,
      nome_cliente: venda.cliente?.nome || null,
      nome_vendedor: venda.user?.email || null, // Correção do nome do vendedor (email)
    };
  }

  // ===============================
  // UPDATES
  // ===============================
  async updateStatusWithTx(
    tx: Prisma.TransactionClient,
    id_venda: string,
    status: string
  ): Promise<void> {
    await tx.venda.update({ where: { id_venda }, data: { status } });
  }

  async updateStatus(id_venda: string, status: string): Promise<void> {
    await prisma.venda.update({ where: { id_venda }, data: { status } });
  }

  async updateValorPagoWithTx(
    tx: Prisma.TransactionClient,
    id_venda: string,
    valor_pago: number
  ): Promise<void> {
    await tx.venda.update({ where: { id_venda }, data: { valor_pago } });
  }

  // ===============================
  // PAGINAÇÃO
  // ===============================
  async findPaginated(
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<RepositoryPaginatedResult<VendaEntity>> {
    // ✅ Tipado com a interface do shared

    const where: Prisma.vendaWhereInput = lojaId ? { id_loja: lojaId } : {};

    const [data, total] = await prisma.$transaction([
      prisma.venda.findMany({
        where,
        orderBy: { data_criacao: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          cliente: true,
        },
      }),
      prisma.venda.count({ where }),
    ]);

    // Usa o helper para garantir a conversão correta de Decimal -> Number
    const dataMapped = data.map((v) => this.mapToEntity(v));

    return { data: dataMapped, total };
  }

  // ===============================
  // BUSCA
  // ===============================
  async searchPaginated(
    term: string,
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<RepositoryPaginatedResult<VendaEntity>> {
    const orConditions: Prisma.vendaWhereInput["OR"] = [
      {
        cliente: {
          nome: { contains: term, mode: "insensitive" },
        },
      },
    ];

    if (isValidUUID(term)) {
      orConditions.push({ id_venda: term });
    }

    const where: Prisma.vendaWhereInput = {
      ...(lojaId ? { id_loja: lojaId } : {}),
      OR: orConditions,
    };

    const [data, total] = await prisma.$transaction([
      prisma.venda.findMany({
        where,
        orderBy: { data_criacao: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          cliente: true,
        },
      }),
      prisma.venda.count({ where }),
    ]);

    const dataMapped = data.map((v) => this.mapToEntity(v));

    return { data: dataMapped, total };
  }

  // ===============================
  // ADD PAGAMENTOS
  // ===============================
  async addPagamentosWithTx(
    tx: Prisma.TransactionClient,
    id_venda: string,
    pagamentos: { tipo_pagamento: string; valor: number }[]
  ) {
    return tx.pagamento_venda.createMany({
      data: pagamentos.map((p) => ({
        id_venda,
        tipo_pagamento: p.tipo_pagamento,
        valor: p.valor,
      })),
    });
  }
}
