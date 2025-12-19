//src/features/access-logs/types/index.tsx
export interface AccessLog {
  id_log_acesso: string;
  data: string | null;
  ip: string | null;
  user_agent: string | null;
  sucesso: boolean | null;
  usuario?: {
    id: string;
    email: string;
    nome?: string;
  };
}
