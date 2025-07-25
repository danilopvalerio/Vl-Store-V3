export interface StoreRegistration {
  nome: string;
  senha: string;
  email: string;
  cpf_cnpj_proprietario_loja: string;
  data_nasc_proprietario: string;
  telefone: string;
}

export interface LojaResponse extends StoreRegistration {
  id_loja: string;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}
