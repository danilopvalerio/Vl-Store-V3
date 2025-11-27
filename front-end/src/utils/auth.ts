// utils/auth.ts
import api from "./api";
import { AxiosError } from "axios";

/**
 * Verifica se o usuário está logado.
 * Retorna true se logado, false se não.
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    await api.get(`/sessions/profile`);
    return true;
  } catch (error: unknown) {
    // Tenta tratar como AxiosError
    const axiosError = error as AxiosError;

    if (axiosError.response?.status === 401) {
      try {
        const refreshResponse = await api.get(`/sessions/refresh`);
        const newAccessToken = refreshResponse.data.accessToken;
        sessionStorage.setItem("accessToken", newAccessToken);

        // Tenta novamente
        await api.get(`/sessions/profile`);
        return true;
      } catch {
        return false;
      }
    } else {
      console.error("Erro inesperado ao verificar login:", axiosError);
      return false;
    }
  }
};
