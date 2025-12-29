export interface Loja {
  id_loja: string;
  nome: string;
  cnpj_cpf: string | null;
  admin_user_id: string | null;
}

export interface UserAccount {
  user_id: string;
  email: string;
}

export interface UserProfile {
  id_user_profile: string;
  user_id: string;
  id_loja: string;
  nome: string;
  cpf_cnpj: string | null;
  cargo: string | null;
}

// Payloads de Envio
export interface UpdateLojaPayload {
  nome: string;
  cnpj_cpf: string;
}

export interface UpdateUserAccountPayload {
  email?: string;
  senha?: string;
}

export interface UpdateUserProfilePayload {
  nome?: string;
  cpf?: string; // O backend espera 'cpf' no update do profile
}

export interface CreateLojaPayload {
  nome: string;
  cnpj_cpf: string;
  // O backend infere o admin_user_id pelo token
}
