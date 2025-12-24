import { z } from "zod";

export const lojaIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "ID da loja inválido" }),
  }),
});

export const createLojaSchema = z.object({
  body: z.object({
    nome: z.string().min(1, "O nome da loja é obrigatório").max(255),
    admin_user_id: z
      .string()
      .uuid({ message: "ID do administrador inválido" })
      .optional(), // Pode ser opcional dependendo do seu fluxo
    cnpj_cpf: z.string().max(20).optional().or(z.literal("")),
    // Adicione outros campos se necessário (endereco, etc)
  }),
});

export const updateLojaSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "ID da loja inválido" }),
  }),
  body: z.object({
    nome: z.string().min(1).max(255).optional(),
    admin_user_id: z.string().uuid().optional(),
    cnpj_cpf: z.string().max(20).optional(),
  }),
});
