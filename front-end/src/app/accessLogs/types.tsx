// app/employees/types.ts

// --- Respostas da API ---

// Paginação Genérica
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// GET /api/profiles (Lista e Detalhe)
export interface UserProfileResponse {
  id_user_profile: string;
  user_id: string;
  id_loja: string;
  nome: string;
  cpf_cnpj: string; // O backend pode retornar 'cpf' ou 'cpf_cnpj', ajuste se necessário
  cargo: string;
  tipo_perfil: string;
  ativo: boolean;
  data_criacao: string;
  ultima_atualizacao: string;
}

// GET /api/users/:id (Baseado no seu JSON real)
export interface UserResponse {
  user_id: string;
  email: string;
  ativo: boolean;
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

// PATCH /api/profiles/:id (Atualizar Profile)
export interface UpdateProfilePayload {
  nome?: string;
  cpf?: string;
  cargo?: string;
}

// Dados do Usuário Logado (localStorage)
export interface LoggedUser {
  id: string;
  email: string;
  nome: string;
  role: string;
  lojaId: string;
}
