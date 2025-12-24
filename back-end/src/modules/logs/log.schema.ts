import { z } from "zod";

// Schema para Paginação e Busca (Query Params)
// Usado em todas as rotas de GET do Log
export const logPaginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).default(10),
    term: z.string().optional(),
    // Caso você queira filtrar por loja na URL (opcional)
    // lojaId: z.string().uuid().optional(),
  }),
});
