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
// CAIXA
// ==========================================

export const caixaIdSchema = z.object({
  params: paramsId,
});

export const caixaPaginationSchema = z.object({
  query: paginationQuery,
});

export const createCaixaSchema = z.object({
  body: z.object({
    id_loja: z.string().uuid({ message: "ID da loja é obrigatório" }),
    // Removido o objeto { invalid_type_error } para corrigir o erro de overload
    saldo_inicial: z
      .number()
      .min(0, "Saldo inicial não pode ser negativo")
      .default(0),
    id_user_profile: z.string().uuid().optional(),
  }),
});

export const toggleCaixaStatusSchema = z.object({
  params: paramsId,
  body: z.object({
    saldo_final: z
      .number()
      .min(0, "Saldo final não pode ser negativo")
      .optional(),
  }),
});

export const updateCaixaUserSchema = z.object({
  params: paramsId,
  body: z.object({
    id_user_profile: z.string().uuid({ message: "Novo ID de perfil inválido" }),
  }),
});

// ==========================================
// MOVIMENTAÇÃO
// ==========================================

// Usamos 'as const' para o TypeScript entender que são valores literais fixos
const TIPOS_MOVIMENTACAO = [
  "ENTRADA",
  "SAIDA",
  "SANGRIA",
  "SUPRIMENTO",
] as const;

export const movPaginationSchema = z.object({
  query: paginationQuery.extend({
    caixaId: z.string().uuid().optional(),
  }),
});

export const movIdSchema = z.object({
  params: paramsId,
});

export const createMovimentacaoSchema = z.object({
  body: z.object({
    id_caixa: z.string().uuid().optional(),

    // CORREÇÃO AQUI: Removemos o segundo argumento com errorMap.
    // O Zod validará automaticamente se o valor está na lista.
    tipo: z.enum(TIPOS_MOVIMENTACAO),

    valor: z.number().positive("O valor da movimentação deve ser positivo"),
    descricao: z
      .string()
      .min(3, "Descrição deve ter no mínimo 3 caracteres")
      .max(255),
  }),
});

export const updateMovimentacaoSchema = z.object({
  params: paramsId,
  body: z.object({
    tipo: z.enum(TIPOS_MOVIMENTACAO).optional(),
    valor: z.number().positive().optional(),
    descricao: z.string().min(3).optional(),
  }),
});
