// src/dtos/log.dto.ts

// --- LOG DE ACESSO ---
export interface CreateLogAcessoDTO {
  id_user?: string;
  ip: string;
  user_agent: string;
  sucesso: boolean;
}

export interface LogAcessoResponseDTO {
  id_log_acesso: string;
  data: string | null; // <--- Mudou de Date para string
  ip: string | null;
  user_agent: string | null;
  sucesso: boolean | null;
  usuario?: {
    id: string;
    email: string;
  };
}

// --- LOG DE SISTEMA ---
export interface CreateLogSistemaDTO {
  id_user?: string;
  acao: string;
  detalhes?: string;
}

export interface LogSistemaResponseDTO {
  id_log_sistema: string;
  data: string | null; // <--- Mudou de Date para string
  acao: string;
  detalhes: string | null;
  usuario?: {
    id: string;
    email: string;
  };
}
