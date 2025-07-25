import { Request, Response } from "express";
import { SessionService } from "../services/SessionService";

export class SessionController {
  /**
   * Cria uma nova sessão para a loja (login).
   */
  async create(request: Request, response: Response): Promise<Response> {
    const { email, senha } = request.body;
    const sessionService = new SessionService();

    try {
      const { loja, accessToken, refreshToken } = await sessionService.create({
        email,
        senha,
      });

      // Define o refresh token em um cookie seguro
      response.cookie("refreshToken", refreshToken, {
        httpOnly: true, // Impede acesso via JavaScript no cliente
        secure: process.env.NODE_ENV !== "development", // Usa HTTPS em produção
        sameSite: "strict", // Ajuda a mitigar ataques CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // Expira em 7 dias
        path: "/api/sessions", // O cookie só será enviado para este path
      });

      return response.json({ loja, accessToken });
    } catch (error) {
      if (error instanceof Error) {
        return response.status(401).json({ message: error.message });
      }
      return response.status(500).json({ message: "Erro interno no servidor" });
    }
  }

  /**
   * Atualiza o access token usando o refresh token.
   */
  async refresh(request: Request, response: Response): Promise<Response> {
    const sessionService = new SessionService();
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return response
        .status(401)
        .json({ message: "Refresh token não encontrado." });
    }

    try {
      const { loja, accessToken } = await sessionService.refresh(refreshToken);
      return response.json({ loja, accessToken });
    } catch (error) {
      return response
        .status(401)
        .json({ message: "Token inválido ou expirado." });
    }
  }

  /**
   * Realiza o logout da loja, invalidando o refresh token.
   */
  async logout(request: Request, response: Response): Promise<Response> {
    const sessionService = new SessionService();
    const refreshToken = request.cookies.refreshToken;

    // Se não houver refresh token, apenas retorna sucesso (o usuário já não está "logado")
    if (!refreshToken) {
      return response.sendStatus(204); // No Content
    }

    try {
      await sessionService.logout(refreshToken);
      // Limpa o cookie do navegador
      response.clearCookie("refreshToken", { path: "/api/sessions" });
      return response.sendStatus(204); // No Content
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Erro interno ao fazer logout." });
    }
  }

  /**
   * Obtém os dados do perfil da loja autenticada.
   */
  async profile(request: Request, response: Response): Promise<Response> {
    const sessionService = new SessionService();
    // O idLoja é adicionado ao `request.user` pelo `authMiddleware`
    const idLoja = request.user.idLoja;

    try {
      const loja = await sessionService.getProfile(idLoja);
      return response.json({ loja });
    } catch (error) {
      if (error instanceof Error) {
        // Se o erro for conhecido (ex: Loja não encontrada), retorna 404
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Erro ao buscar perfil." });
    }
  }
}
