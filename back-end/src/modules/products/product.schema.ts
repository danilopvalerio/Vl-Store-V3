import { z } from "zod";

// Opções permitidas de ordenação
const orderByOptions = z
  .enum([
    "name_asc",
    "name_desc",
    "price_asc",
    "price_desc",
    "stock_asc",
    "stock_desc",
    "newest",
    "oldest",
  ])
  .optional();

const paginationQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10),
  term: z.string().optional(),
  lojaId: z.uuid().optional(),
  orderBy: orderByOptions, // <--- Novo Campo
});

const paramsId = z.object({
  id: z.uuid({ message: "ID inválido" }),
});

export const productIdSchema = z.object({ params: paramsId });
export const productPaginationSchema = z.object({ query: paginationQuery });
export const productNestedPaginationSchema = z.object({
  params: paramsId,
  query: paginationQuery,
});

export const createProductSchema = z.object({
  body: z.object({
    id_loja: z.uuid({ message: "ID da loja é obrigatório" }),
    nome: z.string().min(1, "Nome do produto é obrigatório").max(255),
    referencia: z.string().max(100).optional(),
    categoria: z.string().max(100).optional(),
    material: z.string().max(100).optional(),
    genero: z.string().max(50).optional(),
    ativo: z.boolean().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: paramsId,
  body: z.object({
    nome: z.string().min(1).max(255).optional(),
    referencia: z.string().max(100).optional(),
    categoria: z.string().max(100).optional(),
    material: z.string().max(100).optional(),
    genero: z.string().max(50).optional(),
    ativo: z.boolean().optional(),
  }),
});

export const createVariationSchema = z.object({
  body: z.object({
    id_produto: z.uuid({ message: "ID do produto pai é obrigatório" }),
    nome: z.string().min(1).optional(),
    descricao: z.string().optional(),
    quantidade: z.coerce.number().int().min(0),
    valor: z.coerce.number().min(0),
  }),
});

export const updateVariationSchema = z.object({
  params: paramsId,
  body: z.object({
    nome: z.string().optional(),
    descricao: z.string().optional(),
    quantidade: z.coerce.number().int().min(0).optional(),
    valor: z.coerce.number().min(0).optional(),
  }),
});
