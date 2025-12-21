import { IBaseRepository } from "../../shared/dtos/index.dto";

// ============================================================================
// 1. ENTIDADES DE DOMÍNIO (Outputs - Espelho do Banco com tipos primitivos)
// ============================================================================

export interface CaixaEntity {
  id_caixa: string;
  id_loja: string;
  status: string; // 'ABERTO' | 'FECHADO' | 'REABERTO'
  saldo_inicial: number | null;
  saldo_final: number | null;
  data_abertura: Date | null;
  data_fechamento: Date | null;
  id_user_profile: string;

  // Campo enriquecido (join opcional)
  nome_responsavel?: string;
}

export interface MovimentacaoEntity {
  id_movimentacao: string;
  id_loja: string;
  id_caixa: string;
  id_venda: string | null;
  tipo: string; // 'ENTRADA' | 'SAIDA' | 'SANGRIA' | 'SUPRIMENTO'
  valor: number;
  descricao: string | null;
  data_criacao: Date | null;
  ultima_atualizacao: Date | null;
}

// ============================================================================
// 2. INPUTS DE REPOSITÓRIO (Espelho dos Inputs do Banco)
// Substituem o Prisma.UncheckedCreateInput para desacoplar
// ============================================================================

export interface CaixaCreateInput {
  id_loja: string;
  id_user_profile: string;
  saldo_inicial: number;
  status: string;
  data_abertura: Date;
}

export interface CaixaUpdateInput {
  status?: string;
  saldo_final?: number | null;
  id_user_profile?: string;
  data_fechamento?: Date | null;
}

export interface MovimentacaoCreateInput {
  id_loja: string;
  id_caixa: string;
  tipo: string;
  valor: number;
  descricao?: string | null;
  id_venda?: string | null;
}

export interface MovimentacaoUpdateInput {
  valor?: number;
  descricao?: string;
  tipo?: string;
}

// ============================================================================
// 3. DTOs DE SERVIÇO (Dados vindos do Controller/Front)
// ============================================================================

export interface CreateCaixaDTO {
  id_loja: string;
  saldo_inicial: number;
  id_user_profile?: string;
  actorUserId?: string;
}

export interface UpdateCaixaDTO {
  status?: string;
  saldo_final?: number;
  id_user_profile?: string;
  actorUserId?: string;
}

export interface ToggleCaixaStatusDTO {
  saldo_final?: number;
  actorUserId?: string;
}

export interface UpdateCaixaUserDTO {
  id_user_profile: string;
  actorUserId?: string;
}

// --- Movimentação ---
export type TipoMovimentacao = "ENTRADA" | "SAIDA" | "SANGRIA" | "SUPRIMENTO";

export interface CreateMovimentacaoDTO {
  id_caixa?: string;
  tipo: TipoMovimentacao;
  valor: number;
  descricao?: string;
  actorUserId?: string;
}

export interface UpdateMovimentacaoDTO {
  valor?: number;
  descricao?: string;
  tipo?: TipoMovimentacao;
  actorUserId?: string;
}

// ============================================================================
// 4. TIPOS AUXILIARES
// ============================================================================

export interface RawCaixaStats {
  porTipo: { tipo: string; _sum: { valor: number | null } }[];
  totalVendas: number;
}

export interface CaixaDashboardStats {
  caixa: CaixaEntity;
  estatisticas: {
    saldo_atual: number;
    total_entradas: number;
    total_saidas: number;
    detalhado: {
      VENDA: number;
      ENTRADA_AVULSA: number;
      SAIDA: number;
      SANGRIA: number;
      SUPRIMENTO: number;
    };
  };
}

// ============================================================================
// 5. INTERFACES DE REPOSITÓRIO
// ============================================================================

export interface ICaixaRepository
  extends IBaseRepository<CaixaEntity, CreateCaixaDTO, UpdateCaixaDTO> {
  // Sobrescreve create/update para usar inputs tipados manualmente
  create(data: CaixaCreateInput): Promise<CaixaEntity>;
  update(id: string, data: CaixaUpdateInput): Promise<CaixaEntity>;

  findActiveByProfile(id_user_profile: string): Promise<CaixaEntity | null>;
  getRawStats(id_caixa: string): Promise<RawCaixaStats>;

  findPaginated(
    page: number,
    limit: number,
    id_loja?: string
  ): Promise<{ data: CaixaEntity[]; total: number }>;
  searchPaginated(
    query: string,
    page: number,
    limit: number,
    id_loja?: string
  ): Promise<{ data: CaixaEntity[]; total: number }>;
}

export interface IMovimentacaoRepository {
  create(data: MovimentacaoCreateInput): Promise<MovimentacaoEntity>;
  update(
    id: string,
    data: MovimentacaoUpdateInput
  ): Promise<MovimentacaoEntity>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<MovimentacaoEntity | null>;

  findPaginated(
    page: number,
    limit: number,
    id_loja?: string,
    id_caixa?: string
  ): Promise<{ data: MovimentacaoEntity[]; total: number }>;
  searchPaginated(
    query: string,
    page: number,
    limit: number,
    id_loja?: string,
    id_caixa?: string
  ): Promise<{ data: MovimentacaoEntity[]; total: number }>;
}
