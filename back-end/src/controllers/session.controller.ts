// src/controllers/session.controller.ts
import { Request, Response, NextFunction } from "express";
import { SessionService } from "../services/session.service";
import { LoginDTO, RegisterStoreOwnerDTO } from "../dtos/session.dto";
import {
  isValidEmail,
  isValidString,
  isValidPhoneArray,
} from "../utils/validation";
import { AppError } from "../middlewares/error.middleware"; // <--- Importante

const sessionService = new SessionService();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: "/",
};

export class SessionController {
  // POST /auth/login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as LoginDTO;

      // Validações: Lançamos AppError em vez de retornar res.status
      if (!isValidEmail(body.email)) {
        throw new AppError("Email inválido.", 400);
      }
      if (!isValidString(body.senha)) {
        throw new AppError("Senha requerida.", 400);
      }

      // --- LOGICA PARA PEGAR IP E USER AGENT ---
      const rawIp =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

      let ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
      if (ip.includes(",")) {
        ip = ip.split(",")[0].trim();
      }

      const userAgent = req.headers["user-agent"] || "Desconhecido";
      // -----------------------------------------

      const result = await sessionService.authenticate(body, ip, userAgent);

      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

      return res.json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (err) {
      // TRUQUE DE SEGURANÇA:
      // Se o erro foi "Usuário não existe" ou "Senha errada" vindo do service,
      // você pode querer padronizar tudo como "Email ou senha incorretos" pro usuário não saber qual errou.

      // Se for um erro de sistema (500), deixa passar o original pro log
      if (err instanceof AppError) {
        return next(new AppError("Email ou senha incorretos.", 401));
      }

      next(err);
    }
  }

  // POST /auth/refresh
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new AppError("Refresh token não encontrado.", 401);
      }

      const result = await sessionService.refreshToken(refreshToken);

      return res.json({ accessToken: result.accessToken });
    } catch (err) {
      // Loga no terminal do servidor para você debugar se precisar
      console.error("Erro no refresh:", err);

      // Manda a mensagem genérica pro usuário
      next(new AppError("Token inválido ou expirado.", 403));
    }
  }

  // POST /auth/register
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as RegisterStoreOwnerDTO;

      // Validações manuais convertidas para AppError
      if (!isValidEmail(body.email)) throw new AppError("Email inválido.", 400);

      if (!isValidString(body.senha, 6))
        throw new AppError("Senha deve ter no mínimo 6 caracteres.", 400);

      if (!isValidString(body.nome_loja))
        throw new AppError("Nome da loja requerido.", 400);

      if (!isValidString(body.nome_usuario))
        throw new AppError("Nome do usuário requerido.", 400);

      if (!isValidPhoneArray(body.telefones))
        throw new AppError("Telefones inválidos.", 400);

      const result = await sessionService.registerStoreOwner(body);

      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

      return res.status(201).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /auth/logout
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await sessionService.logout(refreshToken);
      }

      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
