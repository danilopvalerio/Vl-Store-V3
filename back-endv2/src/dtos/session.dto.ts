// src/dtos/session.dto.ts

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
  telefones?: string[];

  // Dados da Loja
  nome_loja: string;
  cnpj_cpf_loja?: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface SessionResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nome: string;
    role: string; // tipo_perfil
    lojaId: string;
    telefones: string[];
  };
}
