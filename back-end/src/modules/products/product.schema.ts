import { z } from "zod";

// ==========================================
// SCHEMAS REUTILIZÁVEIS
// ==========================================

const paginationQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10),
  term: z.string().optional(),
  lojaId: z.string().uuid().optional(),
});

const paramsId = z.object({
  id: z.string().uuid({ message: "ID inválido" }),
});

// ==========================================
// SCHEMAS DE ROTA
// ==========================================

// Validação apenas de ID (GET /:id, DELETE /:id)
export const productIdSchema = z.object({
  params: paramsId,
});

// Validação de Paginação Genérica (GET /paginated, GET /search)
export const productPaginationSchema = z.object({
  query: paginationQuery,
});

// Validação Combinada: ID na URL + Paginação na Query
// Usado em: GET /:id/variations e GET /:id/variations/search
export const productNestedPaginationSchema = z.object({
  params: paramsId, // ID do produto pai
  query: paginationQuery,
});

// ------------------------------------------
// PRODUTO (Create / Update)
// ------------------------------------------

export const createProductSchema = z.object({
  body: z.object({
    id_loja: z.string().uuid({ message: "ID da loja é obrigatório" }),
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

// ------------------------------------------
// VARIAÇÃO (Create / Update)
// ------------------------------------------

export const createVariationSchema = z.object({
  body: z.object({
    id_produto: z.string().uuid({ message: "ID do produto pai é obrigatório" }),
    nome: z.string().min(1, "Nome da variação é obrigatório").optional(), // Pode ser opcional se o produto for único
    descricao: z.string().optional(),
    quantidade: z.number().int().min(0, "Quantidade não pode ser negativa"),
    valor: z.number().min(0, "Valor não pode ser negativo"),
  }),
});

export const updateVariationSchema = z.object({
  params: paramsId,
  body: z.object({
    nome: z.string().optional(),
    descricao: z.string().optional(),
    quantidade: z.number().int().min(0).optional(),
    valor: z.number().min(0).optional(),
  }),
});
