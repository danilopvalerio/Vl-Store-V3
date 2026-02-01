import { z } from "zod";

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
    user_id: z.string().uuid(),
    id_loja: z.string().uuid(),
    nome: z.string().min(3).max(255),
    cpf_cnpj: z.string().max(20).optional().or(z.literal("")),
    cargo: z.string().max(100).optional(),
    tipo_perfil: z.enum(TIPOS_PERFIL).optional(),
    foto_url: z.string().optional(), // Nome do arquivo
  }),
});

export const updateUserProfileSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    nome: z.string().min(3).max(255).optional(),
    cpf_cnpj: z.string().max(20).optional(),
    cargo: z.string().max(100).optional(),
    tipo_perfil: z.enum(TIPOS_PERFIL).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
    foto_url: z.string().optional(), // Nome do arquivo
  }),
});
