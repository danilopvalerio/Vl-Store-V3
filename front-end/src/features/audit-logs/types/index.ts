//src/features/audit-logs/types/index.ts
export interface SystemLog {
  id_log_sistema: string;
  data: string | null;
  acao: string;
  detalhes: string | null;
  usuario?: {
    id: string;
    email: string;
  };
}
