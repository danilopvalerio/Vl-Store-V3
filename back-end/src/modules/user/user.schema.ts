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
    // Dados do Usuário
    email: z.string().email({ message: "Formato de e-mail inválido" }),
    senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    telefones: z.array(z.string()).optional(),

    // Dados do Perfil (Adicione isto!)
    nome: z.string().min(3, "Nome é obrigatório"),
    id_loja: z.string().uuid("ID da loja inválido"),
    cpf_cnpj: z.string().optional(),
    cargo: z.string().optional(),
    tipo_perfil: z.string().default("FUNCIONARIO"), // Ou use o enum se preferir
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
