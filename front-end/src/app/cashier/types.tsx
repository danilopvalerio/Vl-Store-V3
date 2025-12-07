// app/caixas/types.tsx

export type CaixaStatus = "ABERTO" | "FECHADO" | "REABERTO" | "BLOQUEADO";

export interface CaixaResponse {
  id_caixa: string;
  id_loja: string;
  id_user_profile: string;
  nome_responsavel: string | null;
  status: CaixaStatus;
  saldo_inicial: number | string;
  saldo_final: number | string | null;
  data_abertura: string;
  data_fechamento: string | null;
}

// Estatísticas vindas do endpoint /dashboard
export interface DashboardStats {
  saldo_atual: number;
  total_entradas: number;
  total_saidas: number;
  detalhado: {
    VENDA: number;
    ENTRADA_AVULSA: number;
    SUPRIMENTO: number;
    SANGRIA: number;
    SAIDA: number;
  };
}

// Resposta completa do endpoint /dashboard
export interface CaixaDashboardResponse {
  caixa: CaixaResponse;
  estatisticas: DashboardStats;
}

export type TipoMovimentacao = "ENTRADA" | "SAIDA" | "SANGRIA" | "SUPRIMENTO";

export interface MovimentacaoResponse {
  id_movimentacao: string;
  id_caixa: string;
  tipo: TipoMovimentacao;
  valor: number | string;
  descricao?: string;
  data_criacao: string;
  id_venda?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface UserProfileResponse {
  id_user_profile: string;
  nome: string;
  cpf_cnpj: string;
  cargo: string;
}

// --- Payloads ---

export interface CreateCaixaPayload {
  id_loja: string;
  saldo_inicial: number;
  id_user_profile?: string;
}

export interface ToggleStatusPayload {
  saldo_final?: number;
}

export interface UpdateResponsiblePayload {
  id_user_profile: string;
}
