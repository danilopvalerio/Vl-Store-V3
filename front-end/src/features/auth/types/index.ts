// src/features/auth/types/index.ts

import { UserData } from "../../dashboard/types"; // Reutilizando UserData se já existir, senão defina aqui

// Interface para o perfil simplificado (usado na lista de escolha)
export interface ProfileOption {
  id: string; // id_user_profile
  lojaName: string; // nome da loja
  cargo: string;
}

// Interface para a resposta de Login e Troca de Loja
export interface LoginResponse {
  accessToken: string;
  user: UserData; // Dados completos do usuário na sessão

  // Opcionais (apenas no login inicial multi-loja)
  multiProfile?: boolean;
  profiles?: ProfileOption[];
}

// Interface para o Payload de Login
export interface LoginPayload {
  email: string;
  senha: string;
}

// Interface para o Payload de Seleção de Loja
export interface SelectStorePayload {
  profileId: string;
}
