// ============================================================================
// ENTIDADES DE DOMÍNIO (Espelho do Schema Prisma - Datas são Date Objects)
// ============================================================================

export interface LogAccessEntity {
  id_log_acesso: string;
  id_user: string | null;
  ip: string | null;
  user_agent: string | null;
  sucesso: boolean | null;
  data: Date | null;

  // Relação simplificada para retorno interno
  user?: {
    user_id: string;
    email: string;
  } | null;
}

export interface LogSystemEntity {
  id_log_sistema: string;
  id_user: string | null;
  acao: string;
  detalhes: string | null;
  data: Date | null;

  user?: {
    user_id: string;
    email: string;
  } | null;
}

// ============================================================================
// DTOs DE RESPOSTA (O que o Front recebe - Datas são Strings formatadas)
// ============================================================================

export interface LogAccessResponseDTO {
  id_log_acesso: string;
  data: string | null; // Formatado "dd/MM/yyyy HH:mm:ss"
  ip: string | null;
  user_agent: string | null;
  sucesso: boolean | null;
  usuario?: {
    id: string;
    email: string;
  };
}

export interface LogSystemResponseDTO {
  id_log_sistema: string;
  data: string | null; // Formatado
  acao: string;
  detalhes: string | null;
  usuario?: {
    id: string;
    email: string;
  };
}

// ============================================================================
// DTOs DE CRIAÇÃO (INPUTS)
// ============================================================================

export interface CreateLogAcessoDTO {
  id_user?: string;
  ip: string;
  user_agent: string;
  sucesso: boolean;
}

export interface CreateLogSistemaDTO {
  id_user?: string;
  acao: string;
  detalhes?: string;
}
