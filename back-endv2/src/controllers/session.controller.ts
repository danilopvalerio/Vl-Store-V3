// src/controllers/session.controller.ts
import { Request, Response } from "express";
import { SessionService } from "../services/session.service";
import { LoginDTO, RegisterStoreOwnerDTO } from "../dtos/session.dto";
import {
  isValidEmail,
  isValidString,
  isValidPhoneArray,
} from "../utils/validation";

const sessionService = new SessionService();

// Configuração dos Cookies
// Em produção (HTTPS), secure deve ser true. Em localhost, false.
const COOKIE_OPTIONS = {
  httpOnly: true, // O JavaScript do navegador NÃO consegue ler
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const, // Proteção contra CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: "/", // Disponível em todas as rotas
};

export class SessionController {
  // POST /auth/login
  async login(req: Request, res: Response) {
    try {
      const body = req.body as LoginDTO;
      if (!isValidEmail(body.email))
        return res.status(400).json({ error: "Email inválido" });
      if (!isValidString(body.senha))
        return res.status(400).json({ error: "Senha requerida" });

      const result = await sessionService.authenticate(body);

      // 1. Envia o Refresh Token no Cookie (Invisível pro JS)
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

      // 2. Retorna no JSON apenas o Access Token e User
      res.json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro na autenticação";
      res.status(401).json({ error: msg });
    }
  }

  // POST /auth/refresh
  async refresh(req: Request, res: Response) {
    try {
      // Tenta pegar do Cookie (req.cookies vem do cookie-parser)
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken)
        return res.status(401).json({ error: "Refresh token não encontrado" });

      const result = await sessionService.refreshToken(refreshToken);

      // Retorna o novo Access Token
      res.json({ accessToken: result.accessToken });
    } catch (err) {
      res.status(403).json({ error: "Token inválido ou expirado" });
    }
  }

  // POST /auth/register
  async register(req: Request, res: Response) {
    try {
      const body = req.body as RegisterStoreOwnerDTO;

      // Validações...
      if (!isValidEmail(body.email))
        return res.status(400).json({ error: "Email inválido" });
      if (!isValidString(body.senha, 6))
        return res.status(400).json({ error: "Senha fraca (min 6)" });
      if (!isValidString(body.nome_loja))
        return res.status(400).json({ error: "Nome da loja requerido" });
      if (!isValidString(body.nome_usuario))
        return res.status(400).json({ error: "Nome do usuário requerido" });
      if (!isValidPhoneArray(body.telefones))
        return res.status(400).json({ error: "Telefones inválidos" });

      const result = await sessionService.registerStoreOwner(body);

      // Já loga o usuário injetando o cookie
      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

      res.status(201).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no registro";
      res.status(400).json({ error: msg });
    }
  }

  // POST /auth/logout
  async logout(req: Request, res: Response) {
    try {
      // Pega o token do cookie para remover do banco
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await sessionService.logout(refreshToken);
      }

      // Limpa o cookie do navegador
      res.clearCookie("refreshToken", COOKIE_OPTIONS);

      // 204 No Content
      res.status(204).send();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no logout";
      res.status(500).json({ error: msg });
    }
  }
}
