// lib/api.ts
import axios from "axios";

// URL base da API
const API_URL = process.env.NEXT_PUBLIC_API_LINK;

// Cria uma instância do Axios com configurações padrão
const api = axios.create({
  baseURL: API_URL, // Toda requisição vai usar esta URL base
  withCredentials: true, // Permite enviar cookies (refreshToken) automaticamente
});

// ---------------------------
// REQUEST INTERCEPTOR
// ---------------------------
// Antes de cada requisição, este interceptor adiciona o access token no header
api.interceptors.request.use(
  (config) => {
    // Pega o access token do sessionStorage (armazenamento temporário do navegador)
    const accessToken = sessionStorage.getItem("accessToken");

    if (accessToken) {
      // Se existir, adiciona ao header Authorization no formato Bearer
      // Esse é o padrão usado para autenticação com JWT
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Retorna a configuração atualizada para o Axios continuar com a requisição
    return config;
  },
  (error) => {
    // Caso haja algum erro ao preparar a requisição, rejeita a promise
    return Promise.reject(error);
  }
);

// ---------------------------
// RESPONSE INTERCEPTOR
// ---------------------------
// Intercepta todas as respostas da API para tratar erros de autenticação automaticamente
api.interceptors.response.use(
  // Se a resposta for OK (status 2xx), apenas retorna a resposta
  (response) => response,

  // Caso haja um erro na resposta
  async (error) => {
    // Guarda a requisição original (útil para reexecutá-la depois do refresh token)
    const originalRequest = error.config;

    // Extrai o status HTTP e o código personalizado do backend
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // ---------------------------
    // CASO 1: Access token expirado
    // ---------------------------
    if (
      status === 401 && // Status de não autorizado
      code === "ACCESS_TOKEN_EXPIRED" && // Código que o backend retorna quando o access token expirou
      !originalRequest._retry // Evita loop infinito, só tenta uma vez
    ) {
      // Marca que esta requisição já está sendo "retry"
      originalRequest._retry = true;

      try {
        // Chama o endpoint de refresh para gerar um novo access token
        // Note que o refresh token é enviado automaticamente via cookie (withCredentials)
        const { data } = await axios.post(
          `${API_URL}/sessions/refresh`,
          {}, // Corpo vazio, o backend só precisa do cookie
          { withCredentials: true }
        );

        const { accessToken: newAccessToken } = data;

        // Salva o novo access token no sessionStorage para próximas requisições
        sessionStorage.setItem("accessToken", newAccessToken);

        // Atualiza o header Authorization da requisição original
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Refaça a requisição original com o token atualizado
        return api(originalRequest);
      } catch (refreshError) {
        // Se o refresh falhar, significa que o refresh token expirou ou é inválido
        sessionStorage.removeItem("accessToken"); // Remove o token antigo
        window.location.href = "/login"; // Redireciona o usuário para a página de login
        return Promise.reject(refreshError);
      }
    }

    // ---------------------------
    // CASO 2: Refresh token expirado
    // ---------------------------
    if (status === 401 && code === "REFRESH_TOKEN_EXPIRED") {
      // Remove o access token do sessionStorage
      sessionStorage.removeItem("accessToken");

      // Redireciona o usuário para login
      window.location.href = "/login";

      return Promise.reject(error); // Rejeita a promise para que o componente saiba que houve erro
    }

    // Para qualquer outro erro, apenas rejeita a promise
    return Promise.reject(error);
  }
);

// Exporta a instância configurada do Axios para ser usada no restante da aplicação
export default api;
