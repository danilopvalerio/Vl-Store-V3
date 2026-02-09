// app/employees/types.ts

import { BaseEntity } from "@/components/common/GenericEntityPage";

// --- Respostas da API ---
export type UserProfileStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface EmployeeSummary {
  id_user_profile: string;
  cpf: string;
  nome: string;
  cargo: string;
  foto_url?: string | null; // Imagem de perfil
}

// GET /api/profiles (Lista e Detalhe)
export interface UserProfileResponse {
  id_user_profile: string;
  user_id: string;
  id_loja: string;
  nome: string;
  cpf_cnpj: string;
  cargo: string;
  tipo_perfil: string;
  status: UserProfileStatus;
  foto_url?: string | null; // Imagem de perfil
  data_criacao: string;
  ultima_atualizacao: string;
}

// GET /api/users/:id (Baseado no seu JSON real)
export interface UserResponse {
  user_id: string;
  email: string;
  data_criacao: string;
  ultima_atualizacao: string;
  role?: string; // Veio no JSON, mas sabemos que o sistema agora usa profile
  telefones?: string[]; // Opcional: O backend pode ou não mandar
}

// Erro da API
export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

// --- Payloads de Envio (Body) ---

// POST /api/users (Criar User)
export interface CreateUserPayload {
  email: string;
  senha: string;
  telefones?: string[];
}

// PATCH /api/users/:id (Atualizar User)
export interface UpdateUserPayload {
  email?: string;
  senha?: string;
  telefones?: string[];
}

// POST /api/profiles (Criar Profile)
export interface CreateProfilePayload {
  user_id: string;
  id_loja: string;
  nome: string;
  cpf: string; // O backend espera 'cpf' na criação/update segundo seus repositórios
  cargo: string;
  tipo_perfil: string;
}

export interface CreateProfileForExistingUserPayload {
  email: string;
  id_loja: string;
  cargo: string;
  tipo_perfil: string;
}

// PATCH /api/profiles/:id (Atualizar Profile)
export interface UpdateProfilePayload {
  nome?: string;
  cpf?: string;
  cargo?: string;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
  foto?: string | null; // Imagem de perfil
}

// Dados do Usuário Logado (localStorage)
export interface LoggedUser {
  id: string;
  email: string;
  nome: string;
  role: string;
  lojaId: string;
}

// --- Tipo para uso com componentes genéricos ---
// Estende BaseEntity para compatibilidade com GenericEntityPage e EntityCard
export interface EmployeeEntity
  extends Omit<BaseEntity, "status">, Omit<UserProfileResponse, "id"> {
  // Herda todas as propriedades de UserProfileResponse
  // status vem de UserProfileResponse (UserProfileStatus) e não de BaseEntity (string)
}
