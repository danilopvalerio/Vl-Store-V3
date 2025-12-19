// utils/api.ts
import axios from "axios";

// URL base da API
const API_URL = "http://localhost:3333/api";

// Cria uma instância do Axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANTE: Permite que o navegador envie/receba Cookies HttpOnly
});

// ---------------------------
// REQUEST INTERCEPTOR (Envia o Access Token)
// ---------------------------
api.interceptors.request.use(
  (config) => {
    // MUDANÇA: Usamos localStorage para manter o usuário logado se fechar a aba
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---------------------------
// RESPONSE INTERCEPTOR (Renova o Token)
// ---------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se deu erro 401 (Não autorizado) e ainda não tentamos renovar...
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      // Evita loop infinito: se o erro veio da própria rota de refresh, não tenta de novo
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;

      try {
        // MUDANÇA: Chama a rota correta do seu backend (/auth/refresh)
        // Não precisa enviar body, o cookie vai automático por causa do withCredentials
        const { data } = await api.post("/auth/refresh");

        const { accessToken: newAccessToken } = data;

        // Salva o novo token
        localStorage.setItem("accessToken", newAccessToken);

        // Atualiza o header da requisição que falhou e tenta de novo
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar (Refresh token expirou ou inválido), desloga tudo
        console.error("Sessão expirada. Faça login novamente.");

        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        // Redireciona para login (usando window para forçar reload limpo)
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
