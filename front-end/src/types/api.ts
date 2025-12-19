// src/types/api.ts

// Envelope padrão de paginação
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Erro padrão da API
export interface ApiErrorResponse {
  error?: string; // Código do erro ou tipo
  message?: string; // Mensagem legível para o usuário
  statusCode?: number;
}

// Parâmetros de busca genéricos (se usar em várias telas)
export interface PaginationParams {
  page: number;
  perPage: number;
  term?: string;
}
