// src/utils/errorUtils.ts
import { AxiosError } from "axios";

// Definição da resposta de erro padrão do seu backend
export interface ApiErrorDTO {
  error?: string;
  message?: string;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiErrorDTO;
    return data?.error || data?.message || "Erro na requisição.";
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Erro desconhecido.";
}
