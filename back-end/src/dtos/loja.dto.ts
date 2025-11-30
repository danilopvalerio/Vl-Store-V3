import { loja as LojaModel } from "../generated/prisma/client";

// O que o Front envia para criar uma loja
export interface CreateLojaDTO {
  nome: string;
  cnpj_cpf?: string; // Opcional
  admin_user_id?: string; // Opcional (pode ser vinculado depois)
}

// O que o Front envia para atualizar
export interface UpdateLojaDTO {
  nome?: string;
  cnpj_cpf?: string;
  admin_user_id?: string;
}

// O que o Back devolve
// Diferente do User, a Loja não tem senha para esconder,
// então podemos devolver o objeto completo, mas usamos o alias para manter o padrão.
export type LojaResponseDTO = LojaModel;
