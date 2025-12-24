import { z } from "zod";

// Schema para ID nos parâmetros da URL
export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "ID de usuário inválido" }),
  }),
});

// Schema para Paginação e Busca (Query Params)
export const userPaginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).default(10),
    term: z.string().optional(),
  }),
});

// Schema para Criação (POST)
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Formato de e-mail inválido" }),
    senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"), // Assumindo que vem senha no create
    // Ativo geralmente é true por padrão, mas pode vir
    ativo: z.boolean().optional(),
    // Telefones opcional
    telefones: z.array(z.string()).optional(),
  }),
});

// Schema para Atualização (PATCH)
export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "ID de usuário inválido" }),
  }),
  body: z.object({
    email: z.string().email().optional(),
    senha: z.string().min(6).optional(),
    ativo: z.boolean().optional(),
    telefones: z.array(z.string()).optional(),
  }),
});
