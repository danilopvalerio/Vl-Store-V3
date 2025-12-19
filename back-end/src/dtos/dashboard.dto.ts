// src/dtos/dashboard.dto.ts

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
