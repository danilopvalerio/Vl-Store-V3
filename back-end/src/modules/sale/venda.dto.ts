// src/modules/sale/venda.dto.ts
import { RepositoryPaginatedResult } from "../../shared/dtos/index.dto";
import {
  Prisma,
  PrismaClient,
} from "../../shared/database/generated/prisma/client";

// ==========================================
// 1. TIPOS DO PRISMA E TRANSAÇÃO
// ==========================================

// Correção para Transação: Removemos métodos de conexão do Client padrão.
// Isso garante que 'tx.venda', 'tx.caixa', etc. sejam reconhecidos.
export type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Include padrão para buscar uma venda completa
export const vendaInclude = {
  item_venda: {
    include: {
      produto_variacao: {
        include: { produto: { select: { nome: true, referencia: true } } },
      },
    },
  },
  pagamento_venda: true,
  cliente: { select: { nome: true } },
  user: { select: { email: true } },
} satisfies Prisma.vendaInclude;

// Tipo gerado pelo Prisma baseado no include acima
export type VendaFullDb = Prisma.vendaGetPayload<{
  include: typeof vendaInclude;
}>;

// ==========================================
// 2. ENTIDADES DE DOMÍNIO
// ==========================================

export interface VendaEntity {
  id_venda: string;
  id_loja: string;
  id_caixa: string | null;

  // Agora opcional (pode ser null se for venda online sem vendedor)
  id_user: string | null;

  id_cliente: string | null;
  data: Date | null;
  hora: Date | null;
  desconto: number;
  acrescimo: number;
  status: string;

  // Novo campo de tipo
  tipo_venda: string;

  total_final: number;
  valor_pago: number;
  data_criacao: Date | null;
  ultima_atualizacao: Date | null;
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
// 3. DTOs PARA O FRONTEND (Retorno)
// ==========================================

export interface ItemVendaDetailDTO extends ItemVendaEntity {
  nome_produto: string;
  nome_variacao: string | null;
  referencia_produto: string | null;
}

export interface VendaFullDTO extends VendaEntity {
  itens: ItemVendaDetailDTO[];
  pagamentos: PagamentoVendaEntity[];
  nome_cliente?: string | null;
  nome_vendedor?: string | null;
}

// ==========================================
// 4. INPUTS (Dados de Entrada)
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

  // ID do usuário logado (Quem está operando o sistema)
  actorUserId: string;

  // ID do vendedor responsável (Opcional, se o caixa estiver lançando para outro)
  id_vendedor?: string;

  id_caixa?: string;
  id_cliente?: string;
  desconto_global?: number;
  acrescimo_global?: number;
  status?: "PENDENTE" | "FINALIZADA";

  // Tipo da venda (Default: FISICA)
  tipo_venda?: TipoVenda;

  itens: CreateItemInput[];
  pagamentos: CreatePagamentoInput[];
}

export interface UpdateStatusDTO {
  status: "CANCELADA" | "FINALIZADA" | "PENDENTE";
  actorUserId?: string;
}

// Interface auxiliar para cálculos internos antes de salvar
export interface PreparedItemVenda {
  id_variacao: string;
  quantidade: number;
  preco_unitario: number;
  desconto_por_item: number;
  acrescimo_por_item: number;
  preco_final_unitario: number;
  preco_subtotal: number;
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

export interface IItemVendaRepository {
  createManyWithTx(
    tx: PrismaTx,
    idVenda: string,
    itens: PreparedItemVenda[]
  ): Promise<void>;

  findByVendaId(idVenda: string): Promise<ItemVendaDetailDTO[]>;

  findPaginated(
    page: number,
    limit: number,
    idVenda: string
  ): Promise<RepositoryPaginatedResult<ItemVendaDetailDTO>>;
}

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
