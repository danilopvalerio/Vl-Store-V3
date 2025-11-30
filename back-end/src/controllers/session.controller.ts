import { Request, Response } from "express";
import { SessionService } from "../services/session.service";
import { LoginDTO, RegisterStoreOwnerDTO } from "../dtos/session.dto";
import {
  isValidEmail,
  isValidString,
  isValidPhoneArray,
} from "../utils/validation";

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
  async login(req: Request, res: Response) {
    try {
      const body = req.body as LoginDTO;

      // Validações básicas de entrada
      if (!isValidEmail(body.email))
        return res.status(400).json({ error: "Email inválido" });
      if (!isValidString(body.senha))
        return res.status(400).json({ error: "Senha requerida" });

      // --- LOGICA PARA PEGAR IP E USER AGENT ---
      // 1. Tenta pegar IP do proxy (x-forwarded-for), se não tiver, pega do socket
      const rawIp =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
      // 2. Se vier uma lista de IPs, pega o primeiro. Se for string, usa ela.
      let ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
      if (ip.includes(",")) {
        ip = ip.split(",")[0].trim();
      }

      const userAgent = req.headers["user-agent"] || "Desconhecido";
      // -----------------------------------------

      // Passamos o IP e o UserAgent para o service processar o log
      const result = await sessionService.authenticate(body, ip, userAgent);

      res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

      res.json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro na autenticação";
      // 401 Unauthorized é o código padrão para falha de login
      res.status(401).json({ error: msg });
    }
  }

  // POST /auth/refresh
  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken)
        return res.status(401).json({ error: "Refresh token não encontrado" });

      const result = await sessionService.refreshToken(refreshToken);

      res.json({ accessToken: result.accessToken });
    } catch (err) {
      res.status(403).json({ error: "Token inválido ou expirado" });
    }
  }

  // POST /auth/register
  async register(req: Request, res: Response) {
    try {
      const body = req.body as RegisterStoreOwnerDTO;

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
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await sessionService.logout(refreshToken);
      }

      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      res.status(204).send();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no logout";
      res.status(500).json({ error: msg });
    }
  }
}
