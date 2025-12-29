// ============================================================================
// DTOs DE ENTRADA (Input)
// ============================================================================

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface RegisterStoreOwnerDTO {
  email: string;
  senha: string;
  // Dados do Usuário
  nome_usuario: string;
  cpf_usuario: string;
  // Dados da Loja
  nome_loja: string;
  cnpj_cpf_loja?: string;
}

export interface SelectStoreDTO {
  profileId: string; // O ID do perfil que o usuário escolheu
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

// ============================================================================
// DTOs DE SAÍDA (Response)
// ============================================================================

// Dados básicos do usuário na sessão
export interface UserSessionDTO {
  id: string;
  email: string;
  nome: string;
  role: string;
  lojaId: string; // ID da loja ativa no momento
}

// Perfil simplificado para a tela de escolha
export interface ProfileOptionDTO {
  id: string; // id_user_profile
  lojaName: string; // nome da loja
  cargo: string;
}

// Resposta unificada de Autenticação
export interface SessionResponseDTO {
  accessToken: string;
  refreshToken?: string; // Pode não existir se for "Pre-Auth"
  user?: UserSessionDTO; // Pode não existir se for "Pre-Auth"

  // Controle de Múltiplos Perfis
  multiProfile?: boolean;
  profiles?: ProfileOptionDTO[];
}
