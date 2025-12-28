// src/features/sales/types/index.ts

export interface SaleItem {
  id_item_venda: string;
  // O Backend agora manda esses campos diretamente:
  nome_produto: string;
  nome_variacao: string | null;
  referencia_produto: string | null;

  quantidade: number;
  preco_unitario: number;
  preco_final_unitario: number;
  preco_subtotal: number;
  desconto_por_item: number;
  acrescimo_por_item: number;
}

export interface SalePayment {
  id_pagamento: string;
  tipo_pagamento: string;
  valor: number;
}

export interface Sale {
  id_venda: string;
  id_loja: string;
  id_caixa: string | null;
  id_user: string | null;
  id_cliente: string | null;

  data_criacao: string;
  status: "PENDENTE" | "FINALIZADA" | "CANCELADA";
  tipo_venda: string;

  total_final: number;
  valor_pago: number;
  troco: number;

  desconto: number;
  acrescimo: number;

  nome_vendedor?: string | null;
  nome_cliente?: string | null;

  // ✅ CORREÇÃO: O backend retorna 'itens', não 'item_venda'
  itens: SaleItem[];
  // ✅ CORREÇÃO: O backend retorna 'pagamentos', não 'pagamento_venda'
  pagamentos: SalePayment[];
}

// -- Tipos para o Carrinho (Front-end apenas) --
export interface CartItem {
  tempId: string;
  id_variacao: string;
  nome_produto: string;
  nome_variacao: string | null;
  quantidade: number;
  preco_unitario: number;
  desconto_por_item?: number;
  acrescimo_por_item?: number;
  subtotal: number;
}

// -- Payloads (Mantém igual, pois o backend espera 'itens' e 'pagamentos') --
export interface CreateSaleItemPayload {
  id_variacao: string;
  quantidade: number;
  desconto_por_item?: number;
  acrescimo_por_item?: number;
  preco_unitario_override?: number;
}

export interface CreateSalePaymentPayload {
  tipo_pagamento: string;
  valor: number;
}

export interface CreateSalePayload {
  id_loja: string;
  actorUserId: string;
  id_vendedor?: string;
  id_caixa?: string;
  id_cliente?: string | null;
  desconto_global?: number;
  acrescimo_global?: number;
  status?: "PENDENTE" | "FINALIZADA";
  tipo_venda?: "FISICA" | "ONLINE" | "DELIVERY" | "MARKETPLACE";
  itens: CreateSaleItemPayload[];
  pagamentos: CreateSalePaymentPayload[];
}

export interface SellerOption {
  id_user_profile: string;
  nome: string;
}

export interface CashierOption {
  id_caixa: string;
  nome_responsavel: string;
  status: string;
}
