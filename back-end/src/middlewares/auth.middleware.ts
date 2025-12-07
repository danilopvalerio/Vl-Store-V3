import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "./error.middleware";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token não fornecido.", 401);
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    throw new AppError("Token mal formatado.", 401);
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    throw new AppError("Token mal formatado.", 401);
  }

  try {
    const payload = verifyAccessToken(token);

    // O TypeScript agora sabe que 'user' existe no Request
    // Graças ao arquivo express.d.ts
    req.user = payload;

    return next();
  } catch {
    throw new AppError("Token inválido ou expirado.", 401);
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      throw new AppError("Acesso proibido.", 403);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(`Requer permissão: ${allowedRoles.join(" ou ")}`, 403);
    }

    return next();
  };
}
