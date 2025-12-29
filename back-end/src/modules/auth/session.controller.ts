import { Request, Response } from "express";
import { SessionService } from "./session.service";
import { LoginDTO, RegisterStoreOwnerDTO, SelectStoreDTO } from "./session.dto";
import { AppError } from "../../app/middleware/error.middleware";

const COOKIE_OPTIONS = {
  httpOnly: true, // Impede acesso via JS (document.cookie)
  secure: process.env.NODE_ENV === "production", // HTTPS em produção
  sameSite: "strict" as const, // Proteção CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: "/",
};

export class SessionController {
  constructor(private service: SessionService) {}

  private getClientIp(req: Request): string {
    const rawIp =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    let ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    if (ip.includes(",")) ip = ip.split(",")[0].trim();
    return ip;
  }

  // --- LOGIN ---
  login = async (req: Request, res: Response) => {
    const body = req.body as LoginDTO;
    const ip = this.getClientIp(req);
    const userAgent = req.headers["user-agent"] || "Unknown";

    const result = await this.service.authenticate(body, ip, userAgent);

    // Lógica de separação: Refresh Token no Cookie, resto no JSON
    const { refreshToken, ...responsePayload } = result;

    if (refreshToken) {
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    }

    return res.json(responsePayload);
  };

  // --- SELEÇÃO DE LOJA ---
  selectStore = async (req: Request, res: Response) => {
    const body = req.body as SelectStoreDTO;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Token de pré-autenticação inválido.", 401);
    }

    const ip = this.getClientIp(req);
    const userAgent = req.headers["user-agent"] || "Unknown";

    const result = await this.service.selectStore(userId, body, ip, userAgent);

    // Separa o token para o cookie
    const { refreshToken, ...responsePayload } = result;

    if (refreshToken) {
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    }

    return res.json(responsePayload);
  };

  // --- REGISTRO ---
  register = async (req: Request, res: Response) => {
    const body = req.body as RegisterStoreOwnerDTO;
    const result = await this.service.registerStoreOwner(body);

    const { refreshToken, ...responsePayload } = result;

    if (refreshToken) {
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    }

    return res.status(201).json(responsePayload);
  };

  // --- REFRESH ---
  refresh = async (req: Request, res: Response) => {
    // Pega APENAS do cookie
    const refreshTokenCookie = req.cookies.refreshToken;

    if (!refreshTokenCookie) {
      throw new AppError("Refresh token não encontrado.", 401);
    }

    const result = await this.service.refreshToken(refreshTokenCookie);

    // Se o service rotacionar o refresh token (gerar um novo), atualizamos o cookie
    // Caso contrário (se retornar só accessToken), mantemos o cookie antigo
    // No seu DTO atual, o refreshToken é opcional na resposta
    /* Nota: Se você implementar rotação de refresh token no service, 
       descomente a lógica abaixo e adicione refreshToken no retorno do service.
    */
    // if (result.refreshToken) {
    //    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);
    // }

    return res.json(result);
  };

  // --- LOGOUT ---
  logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await this.service.logout(refreshToken);
    }

    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return res.status(204).send();
  };

  getProfiles = async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError("Não autenticado.", 401);

    const profiles = await this.service.getMyProfiles(userId);
    return res.json(profiles);
  };
}
