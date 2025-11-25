import { user_profile as UserProfileModel } from "../generated/prisma/client";

// Input para criação
export interface CreateUserProfileDTO {
  user_id: string;
  id_loja: string;
  nome: string;
  cpf_cnpj?: string;
  cargo?: string;
  tipo_perfil?: string; // Ex: OWNER, MANAGER, EMPLOYEE
}

// Input para atualização
export interface UpdateUserProfileDTO {
  nome?: string;
  cpf_cnpj?: string;
  cargo?: string;
  tipo_perfil?: string;
  ativo?: boolean; // Booleano para ativar/desativar
}

// Output (Resposta)
export type UserProfileResponseDTO = UserProfileModel;
