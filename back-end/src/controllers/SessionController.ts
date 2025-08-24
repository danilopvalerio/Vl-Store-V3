//src/controllers/SessionController.ts
import { Request, Response } from "express";
import { SessionService } from "../services/SessionService";

export class SessionController {
  /**
   * Cria uma nova sessão para a loja ou funcionário (login).
   */
  async create(request: Request, response: Response): Promise<Response> {
    const { email, senha, user_role } = request.body;
    const sessionService = new SessionService();

    try {
      const { user, role, accessToken, refreshToken } =
        await sessionService.create({
          email,
          senha,
          user_role,
        });

      response.cookie("refreshToken", refreshToken, {
        httpOnly: true, // Impede acesso via JavaScript no cliente
        secure: process.env.NODE_ENV !== "development", // Usa HTTPS em produção
        sameSite: "strict", // Ajuda a mitigar ataques CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // Expira em 7 dias
        path: "/api/sessions", // O cookie só será enviado para este path
      });

      return response.json({ user, role, accessToken });
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
      return response.status(401).json({
        code: "REFRESH_TOKEN_EXPIRED",
        message: "Refresh token não encontrado.",
      });
    }

    try {
      const { accessToken } = await sessionService.refresh(refreshToken);
      return response.json({ accessToken });
    } catch (error) {
      return response
        .status(401)
        .json({ message: "Token inválido ou expirado." });
    }
  }

  /**
   * Realiza o logout, invalidando o refresh token.
   */
  async logout(request: Request, response: Response): Promise<Response> {
    const sessionService = new SessionService();
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return response.sendStatus(204); // No Content
    }

    try {
      await sessionService.logout(refreshToken);
      response.clearCookie("refreshToken", { path: "/api/sessions" });
      return response.sendStatus(204); // No Content
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Erro interno ao fazer logout." });
    }
  }

  /**
   * Obtém os dados do perfil do usuário autenticado (loja ou funcionário).
   */
  async profile(request: Request, response: Response): Promise<Response> {
    const sessionService = new SessionService();

    const { idLoja, sub, user_role } = request.user;

    try {
      const userProfile = await sessionService.getProfile(sub, user_role);
      // sub = idLoja se admin, sub = cpf se employee
      return response.json({ user: userProfile, role: user_role });
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Erro ao buscar perfil." });
    }
  }
}
