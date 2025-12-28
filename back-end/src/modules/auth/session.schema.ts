import { z } from "zod";

// ==========================================
// SCHEMAS DE AUTENTICAÇÃO
// ==========================================

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Formato de e-mail inválido" }),
    // No login não validamos complexidade de senha, apenas se foi enviada
    senha: z.string().min(1, "A senha é obrigatória"),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Formato de e-mail inválido" }),
    senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),

    // Dados do Usuário (Dono)
    nome_usuario: z
      .string()
      .min(3, "Nome do usuário deve ter no mínimo 3 caracteres"),
    cpf_usuario: z
      .string()
      .min(11, "CPF deve ter no mínimo 11 caracteres")
      .max(14),

    // Dados da Loja
    nome_loja: z
      .string()
      .min(3, "Nome da loja deve ter no mínimo 3 caracteres"),
    cnpj_cpf_loja: z.string().max(20).optional(),
  }),
});

export const refreshTokenSchema = z.object({
  cookies: z.object({
    // Mudou de body para cookies
    refreshToken: z.string().min(1, "Refresh Token é obrigatório"),
  }),
});
