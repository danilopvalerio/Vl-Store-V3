import { z } from "zod";

// 1. Definimos os tipos como uma constante "readonly" (as const)
// Isso resolve o erro "Argument of type 'string[]' is not assignable..."
const TIPOS_PERFIL = [
  "ADMIN",
  "GERENTE",
  "VENDEDOR",
  "FUNCIONARIO",
  "SUPER_ADMIN",
] as const;

export const userProfileIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "ID do perfil inválido" }),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string().uuid({ message: "ID do usuário inválido" }),
  }),
});

export const createUserProfileSchema = z.object({
  body: z.object({
    user_id: z
      .string()
      .uuid({ message: "ID do usuário é obrigatório e deve ser UUID" }),
    id_loja: z
      .string()
      .uuid({ message: "ID da loja é obrigatório e deve ser UUID" }),
    nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(255),

    // Aceita string vazia ou formato válido
    cpf_cnpj: z.string().max(20).optional().or(z.literal("")),

    cargo: z.string().max(100).optional(),

    // 2. Passamos a constante aqui.
    // Removi o 'errorMap' de dentro para evitar o erro de overload.
    // O Zod já retornará uma mensagem padrão útil ("Expected 'ADMIN' | 'GERENTE'...")
    tipo_perfil: z.enum(TIPOS_PERFIL).optional(),
  }),
});

export const updateUserProfileSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "ID do perfil inválido" }),
  }),
  body: z.object({
    nome: z.string().min(3).max(255).optional(),
    cpf_cnpj: z.string().max(20).optional(),
    cargo: z.string().max(100).optional(),
    // Como é update, também usamos o enum para garantir integridade
    tipo_perfil: z.enum(TIPOS_PERFIL).optional(),
  }),
});
