import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(1, "A senha é obrigatória"),
  }),
});

export const selectStoreSchema = z.object({
  body: z.object({
    profileId: z.string().uuid("ID do perfil inválido"),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    nome_usuario: z.string().min(3, "Nome do usuário obrigatório"),
    cpf_usuario: z.string().min(11).max(14, "CPF inválido"),
    nome_loja: z.string().min(3, "Nome da loja obrigatório"),
    cnpj_cpf_loja: z.string().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, "Refresh Token ausente"),
  }),
});
