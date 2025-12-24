// src/modules/sale/venda.schema.ts
import { z } from "zod";

const paginationQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10),
  term: z.string().optional(),
  lojaId: z.uuid("ID da loja inválido").optional(),
});

const paramsId = z.object({
  id: z.uuid("ID inválido"),
});

const itemSchema = z.object({
  id_variacao: z.uuid("ID de variação inválido"),
  quantidade: z.number().int().positive("Quantidade deve ser positiva"),
  preco_unitario_override: z.number().min(0).optional(),
  desconto_por_item: z.number().min(0).default(0),
  acrescimo_por_item: z.number().min(0).default(0),
});

const pagamentoSchema = z.object({
  tipo_pagamento: z.enum([
    "DINHEIRO",
    "PIX",
    "CARTAO_CREDITO",
    "CARTAO_DEBITO",
    "CREDIARIO",
  ]),
  valor: z.number().positive("Valor deve ser positivo"),
});

// Enum para o tipo de venda
const tipoVendaEnum = z.enum(["FISICA", "ONLINE", "DELIVERY", "MARKETPLACE"]);

export const createVendaSchema = z.object({
  body: z.object({
    id_loja: z.uuid("ID da loja inválido"),

    // Se o caixa estiver lançando venda de outro, ele manda esse ID.
    id_vendedor: z.uuid("ID do vendedor inválido").optional(),

    id_caixa: z.uuid("ID do caixa inválido").optional(),
    id_cliente: z.uuid("ID do cliente inválido").optional(),
    desconto_global: z.number().min(0).default(0),
    acrescimo_global: z.number().min(0).default(0),
    status: z.enum(["PENDENTE", "FINALIZADA"]).default("FINALIZADA"),

    tipo_venda: tipoVendaEnum.default("FISICA"),

    itens: z.array(itemSchema).min(1, "A venda deve ter pelo menos 1 item"),
    pagamentos: z
      .array(pagamentoSchema)
      .min(1, "A venda deve ter pelo menos 1 forma de pagamento"),
  }),
});

export const updateStatusSchema = z.object({
  params: paramsId,
  body: z.object({
    status: z.enum(["PENDENTE", "FINALIZADA", "CANCELADA"]),
  }),
});

export const vendaIdSchema = z.object({
  params: paramsId,
});

export const vendaPaginationSchema = z.object({
  query: paginationQuery,
});
