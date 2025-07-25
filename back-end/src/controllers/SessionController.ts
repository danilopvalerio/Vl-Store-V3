import { Request, Response } from "express";
import { SessionService } from "../services/SessionService";

export class SessionController {
  async create(request: Request, response: Response): Promise<Response> {
    const { email, senha } = request.body;
    const sessionService = new SessionService();

    try {
      const { loja, accessToken, refreshToken } = await sessionService.create({
        email,
        senha,
      });

      response.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        path: "/api/sessions",
      });

      return response.json({ loja, accessToken });
    } catch (error) {
      if (error instanceof Error) {
        return response.status(401).json({ message: error.message });
      }
      return response.status(500).json({ message: "Erro interno no servidor" });
    }
  }

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

  async logout(request: Request, response: Response): Promise<Response> {
    const sessionService = new SessionService();
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return response.sendStatus(204);
    }

    await sessionService.logout(refreshToken);
    response.clearCookie("refreshToken", { path: "/api/sessions" });

    return response.sendStatus(204);
  }
}
