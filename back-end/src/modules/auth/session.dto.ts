// ============================================================================
// DTOs DE ENTRADA
// ============================================================================

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface RegisterStoreOwnerDTO {
  email: string;
  senha: string;
  // Dados do Admin (Pessoa)
  nome_usuario: string;
  cpf_usuario: string;
  // Dados da Loja
  nome_loja: string;
  cnpj_cpf_loja?: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

// ============================================================================
// DTOs DE SAÍDA (SESSÃO LEVE)
// ============================================================================

export interface UserSessionDTO {
  id: string;
  email: string;
  nome: string;
  role: string;
  lojaId: string;
  // Sem telefones
}

export interface SessionResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserSessionDTO;
}
