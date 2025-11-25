// src/dtos/user.dto.ts
import { user as UserModel } from "../generated/prisma/client";

// O que o Front envia para criar
export interface CreateUserDTO {
  email: string;
  senha: string;
  role?: string; // Default será 'USER' se não enviado
}

// O que o Front pode enviar para atualizar
export interface UpdateUserDTO {
  email?: string;
  senha?: string;
  role?: string;
  ativo?: boolean;
}

// O que o Back devolve (User do banco SEM a senha)
export type UserResponseDTO = Omit<UserModel, "senha_hash">;
