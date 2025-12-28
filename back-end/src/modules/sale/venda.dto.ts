import {
  Prisma,
  PrismaClient,
} from "../../shared/database/generated/prisma/client";
// Importamos o RepositoryPaginatedResult para tipar os métodos de busca
import { RepositoryPaginatedResult } from "../../shared/dtos/index.dto";

// ==========================================
// 1. TIPOS DO PRISMA E TRANSAÇÃO
// ==========================================

export type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export const vendaInclude = {
  item_venda: {
    include: {
      produto_variacao: {
        include: {
          produto: {
            select: { nome: true, referencia: true },
          },
        },
      },
    },
  },
  pagamento_venda: true,
  cliente: { select: { nome: true } },
  caixa: true,
  user: { select: { email: true } },
} satisfies Prisma.vendaInclude;

export type VendaFullDb = Prisma.vendaGetPayload<{
  include: typeof vendaInclude;
}>;

export type VendaListDb = Prisma.vendaGetPayload<{
  include: { cliente: true };
}>;

// ==========================================
// 2. ENTIDADES DE DOMÍNIO
// ==========================================

export interface VendaEntity {
  id_venda: string;
  id_loja: string;
  id_caixa: string | null;
  id_user: string | null;
  id_cliente: string | null;
  data: Date | null;
  hora: Date | null;
  desconto: number;
  acrescimo: number;
  status: string;
  tipo_venda: string;
  total_final: number;
  valor_pago: number;
  troco: number;
  data_criacao: Date | null;
  ultima_atualizacao: Date | null;
  nome_cliente?: string | null;
}

export interface ItemVendaEntity {
  id_item_venda: string;
  id_venda: string;
  id_variacao: string;
  quantidade: number;
  preco_unitario: number;
  desconto_por_item: number;
  acrescimo_por_item: number;
  preco_final_unitario: number;
  preco_subtotal: number;
}

export interface PagamentoVendaEntity {
  id_pagamento: string;
  id_venda: string;
  tipo_pagamento: string;
  valor: number;
}

// ==========================================
// 3. DTOs DETALHADOS
// ==========================================

export interface ItemVendaDetailDTO extends ItemVendaEntity {
  nome_produto: string;
  nome_variacao: string | null;
  referencia_produto: string | null;
}

export interface VendaFullDTO extends VendaEntity {
  itens: ItemVendaDetailDTO[];
  pagamentos: PagamentoVendaEntity[];
  nome_vendedor?: string | null;
}

// ==========================================
// 4. INPUTS E UPDATE
// ==========================================

export type TipoVenda = "FISICA" | "ONLINE" | "DELIVERY" | "MARKETPLACE";

export interface CreateItemInput {
  id_variacao: string;
  quantidade: number;
  preco_unitario_override?: number;
  desconto_por_item?: number;
  acrescimo_por_item?: number;
}

export interface CreatePagamentoInput {
  tipo_pagamento: string;
  valor: number;
}

export interface CreateVendaDTO {
  id_loja: string;
  actorUserId: string;
  id_vendedor?: string;
  id_caixa?: string;
  id_cliente?: string;
  desconto_global?: number;
  acrescimo_global?: number;
  status?: "PENDENTE" | "FINALIZADA";
  tipo_venda?: TipoVenda;
  itens: CreateItemInput[];
  pagamentos: CreatePagamentoInput[];
}

export interface PreparedItemVenda {
  id_variacao: string;
  quantidade: number;
  preco_unitario: number;
  desconto_por_item: number;
  acrescimo_por_item: number;
  preco_final_unitario: number;
  preco_subtotal: number;
}

export interface UpdateStatusDTO {
  status: "CANCELADA" | "FINALIZADA" | "PENDENTE";
  actorUserId?: string;
}

// ==========================================
// 5. INTERFACES DOS REPOSITÓRIOS
// ==========================================

export interface IVendaRepository {
  createWithTx(
    tx: PrismaTx,
    data: CreateVendaDTO,
    totalFinal: number
  ): Promise<VendaEntity>;

  updateStatusWithTx(tx: PrismaTx, id: string, status: string): Promise<void>;
  updateStatus(id: string, status: string): Promise<void>;

  findById(id: string): Promise<VendaFullDTO | null>;

  findPaginated(
    page: number,
    limit: number,
    id_loja?: string
  ): Promise<RepositoryPaginatedResult<VendaEntity>>;

  searchPaginated(
    query: string,
    page: number,
    limit: number,
    id_loja?: string
  ): Promise<RepositoryPaginatedResult<VendaEntity>>;
}

// ✅ (REINSERIDA) Interface para o repositório de itens
export interface IItemVendaRepository {
  createManyWithTx(
    tx: PrismaTx,
    idVenda: string,
    itens: PreparedItemVenda[]
  ): Promise<void>;

  findPaginated(
    page: number,
    limit: number,
    idVenda: string
  ): Promise<RepositoryPaginatedResult<ItemVendaDetailDTO>>;
}

// ✅ (REINSERIDA) Interface para o repositório auxiliar (Estoque/Movimentação)
export interface IVendaAuxRepository {
  decrementStock(tx: PrismaTx, idVariacao: string, qtd: number): Promise<void>;
  incrementStock(tx: PrismaTx, idVariacao: string, qtd: number): Promise<void>;
  createMovimentacao(
    tx: PrismaTx,
    data: {
      id_loja: string;
      id_caixa: string;
      id_venda: string;
      tipo: "ENTRADA" | "SAIDA";
      valor: number;
      descricao: string;
    }
  ): Promise<void>;
}
