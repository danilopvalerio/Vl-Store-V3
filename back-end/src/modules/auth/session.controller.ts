import { Request, Response } from "express";
import { SessionService } from "./session.service";
import { LoginDTO, RegisterStoreOwnerDTO } from "./session.dto";
import { isValidEmail, isValidString } from "../../shared/utils/validation";
import { AppError } from "../../app/middleware/error.middleware";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  path: "/",
};

export class SessionController {
  constructor(private service: SessionService) {}

  // Helper privado para extrair IP
  private getClientIp(req: Request): string {
    const rawIp =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    let ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }
    return ip;
  }

  login = async (req: Request, res: Response) => {
    const body = req.body as LoginDTO;

    // Validações de entrada
    if (!isValidEmail(body.email)) throw new AppError("Email inválido.", 400);
    if (!isValidString(body.senha)) throw new AppError("Senha requerida.", 400);

    const ip = this.getClientIp(req);
    const userAgent = req.headers["user-agent"] || "Desconhecido";

    const result = await this.service.authenticate(body, ip, userAgent);

    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

    return res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError("Refresh token não encontrado.", 401);
    }

    const result = await this.service.refreshToken(refreshToken);

    return res.json({ accessToken: result.accessToken });
  };

  register = async (req: Request, res: Response) => {
    const body = req.body as RegisterStoreOwnerDTO;

    // Validações de entrada
    if (!isValidEmail(body.email)) throw new AppError("Email inválido.", 400);
    if (!isValidString(body.senha, 6))
      throw new AppError("Senha deve ter no mínimo 6 caracteres.", 400);
    if (!isValidString(body.nome_loja))
      throw new AppError("Nome da loja requerido.", 400);
    if (!isValidString(body.nome_usuario))
      throw new AppError("Nome do usuário requerido.", 400);

    const result = await this.service.registerStoreOwner(body);

    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  };

  logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await this.service.logout(refreshToken);
    }

    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return res.status(204).send();
  };
}
