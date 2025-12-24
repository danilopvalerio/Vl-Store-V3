//src/modules/sale/item_venda.repository.ts
import { prisma } from "../../shared/database/prisma";
import { Prisma } from "../../shared/database/generated/prisma/client";
import { RepositoryPaginatedResult } from "../../shared/dtos/index.dto";
import {
  IItemVendaRepository,
  PreparedItemVenda,
  PrismaTx,
  ItemVendaDetailDTO,
} from "./venda.dto";

// ============================================================================
// 1. DEFINIÇÃO DE TIPOS ESTRITOS (Zero Any)
// ============================================================================

// Definimos o 'include' como uma constante para reusar na query e na tipagem
const itemVendaInclude = {
  produto_variacao: {
    include: {
      produto: {
        select: {
          nome: true,
          referencia: true,
        },
      },
    },
  },
} satisfies Prisma.item_vendaInclude;

// Criamos o tipo exato do retorno do banco baseado no include acima
type ItemVendaFullDb = Prisma.item_vendaGetPayload<{
  include: typeof itemVendaInclude;
}>;

// ============================================================================
// 2. IMPLEMENTAÇÃO DO REPOSITÓRIO
// ============================================================================

export class ItemVendaRepository implements IItemVendaRepository {
  // Helper privado para mapear o tipo do Banco para o DTO
  // Aqui recebemos 'ItemVendaFullDb' em vez de 'any'
  private mapToDTO(row: ItemVendaFullDb): ItemVendaDetailDTO {
    return {
      id_item_venda: row.id_item_venda,
      id_venda: row.id_venda,
      id_variacao: row.id_variacao,
      quantidade: row.quantidade,

      // Conversões de Decimal
      preco_unitario: Number(row.preco_unitario),
      preco_final_unitario: Number(row.preco_final_unitario),
      preco_subtotal: Number(row.preco_subtotal),
      desconto_por_item: Number(row.desconto_por_item ?? 0),
      acrescimo_por_item: Number(row.acrescimo_por_item ?? 0),

      // Dados achatados das relações (Safe Navigation)
      nome_produto: row.produto_variacao?.produto?.nome || "Produto Removido",
      nome_variacao: row.produto_variacao?.nome || null,
      referencia_produto: row.produto_variacao?.produto?.referencia || null,
    };
  }

  // --- 1. Criação em Lote (Transacional) ---
  async createManyWithTx(
    tx: PrismaTx,
    idVenda: string,
    itens: PreparedItemVenda[]
  ): Promise<void> {
    if (itens.length === 0) return;

    await tx.item_venda.createMany({
      data: itens.map((item) => ({
        id_venda: idVenda,
        id_variacao: item.id_variacao,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto_por_item: item.desconto_por_item,
        acrescimo_por_item: item.acrescimo_por_item,
        preco_final_unitario: item.preco_final_unitario,
        preco_subtotal: item.preco_subtotal,
      })),
    });
  }

  // --- 2. Busca por ID da Venda (Sem paginação - usado para detalhes completos) ---
  async findByVendaId(idVenda: string): Promise<ItemVendaDetailDTO[]> {
    const itens = await prisma.item_venda.findMany({
      where: { id_venda: idVenda },
      include: itemVendaInclude, // Usamos a constante aqui
      orderBy: { data_criacao: "asc" },
    });

    return itens.map((item) => this.mapToDTO(item));
  }

  // --- 3. Busca Paginada (Para listas grandes) ---
  async findPaginated(
    page: number,
    limit: number,
    idVenda: string
  ): Promise<RepositoryPaginatedResult<ItemVendaDetailDTO>> {
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.item_venda.findMany({
        where: { id_venda: idVenda },
        take: limit,
        skip,
        include: itemVendaInclude, // Usamos a mesma constante
        orderBy: { data_criacao: "asc" },
      }),
      prisma.item_venda.count({ where: { id_venda: idVenda } }),
    ]);

    return {
      data: rows.map((item) => this.mapToDTO(item)),
      total,
    };
  }
}
