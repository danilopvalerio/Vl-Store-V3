import { Prisma } from "../../shared/database/generated/prisma/client";

// ============================================================================
// 1. DTOs DE RESPOSTA (JSON para o Front-end)
// ============================================================================

export interface FinancialMetricsDTO {
  revenue: number;
  salesCount: number;
  ticket: number;
}

export interface OperationalMetricsDTO {
  openCashiers: number;
  lowStock: number;
}

export interface ChartDataDTO {
  name: string;
  value: number;
}

export interface RecentSaleDTO {
  id: string;
  total: number;
  time: string;
  status: string | null;
  customer: string;
  seller: string;
}

export interface DashboardSummaryDTO {
  financial: FinancialMetricsDTO;
  operational: OperationalMetricsDTO;
  charts: {
    paymentMethods: ChartDataDTO[];
  };
  feed: RecentSaleDTO[];
}

// ============================================================================
// 2. CONTRATOS DO REPOSITÓRIO (Tipagem Estrita do Banco)
// ============================================================================

// Tipo para o retorno do Aggregate (Financeiro)
export interface RawFinancialData {
  _sum: { total_final: Prisma.Decimal | null };
  _count: { id_venda: number };
}

// Tipo para o retorno do GroupBy (Pagamentos)
export interface RawPaymentData {
  tipo_pagamento: string;
  _sum: { valor: Prisma.Decimal | null };
}

/**
 * Tipo específico para a query de "Vendas Recentes".
 * Espelha exatamente o 'select' feito no repositório.
 */
export interface RawRecentSaleData {
  id_venda: string;
  total_final: Prisma.Decimal; // Prisma retorna Decimal, não number
  hora: Date | null;
  status: string | null;
  data_criacao: Date | null;
  // Relação com Cliente (pode ser null)
  cliente: {
    nome: string;
  } | null;
  // Relação com User -> UserProfile (Array)
  user: {
    user_profile: {
      nome: string;
    }[];
  };
}

// Interface do Repositório
export interface IDashboardRepository {
  getFinancialAggregates(
    lojaId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RawFinancialData>;
  countOpenCashiers(lojaId: string): Promise<number>;
  countLowStock(lojaId: string, threshold: number): Promise<number>;
  getPaymentStats(
    lojaId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RawPaymentData[]>;
  getRecentSales(lojaId: string, limit: number): Promise<RawRecentSaleData[]>;
}
