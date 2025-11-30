// src/dtos/user.dto.ts
import { user as UserModel } from "../generated/prisma/client";

// O que o Front envia para criar
export interface CreateUserDTO {
  email: string;
  senha: string;
  telefones?: string[]; // Array de strings (ex: ["1199999999", "1188888888"])
}

// O que o Front pode enviar para atualizar
export interface UpdateUserDTO {
  email?: string;
  senha?: string;
  ativo?: boolean;
  telefones?: string[]; // Se enviar, substitui os antigos
}

// O que o Back devolve.
// Estendemos o Omit para adicionar o campo 'telefones' que não existe nativamente na tabela 'user'
export type UserResponseDTO = Omit<UserModel, "senha_hash"> & {
  telefones: string[];
};
