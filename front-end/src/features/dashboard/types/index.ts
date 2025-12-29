export type UserData = {
  id: string;
  email: string;
  nome: string;
  role: string;
  lojaId?: string;
};

// Interface para o retorno da API
export interface DashboardData {
  financial: {
    revenue: number;
    salesCount: number;
    ticket: number;
  };
  operational: {
    openCashiers: number;
    lowStock: number;
  };
  feed: {
    id: string;
    total: number;
    time: string;
    status: string | null;
    customer: string;
    seller: string;
  }[];
}

export interface StoreData {
  id_loja: string;
  nome: string;
  cnpj_cpf?: string | null;
}
