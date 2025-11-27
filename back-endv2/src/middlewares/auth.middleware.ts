// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

// Estende a tipagem do Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        profileId: string;
        lojaId: string;
        role: string;
      };
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  // Esperado: "Bearer eyJhbGci..."
  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({ error: "Token mal formatado" });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token mal formatado" });
  }

  try {
    const payload = verifyAccessToken(token);

    // Injeta payload no request
    req.user = payload;

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Middleware de Permissão (Role)
// Verifica se o 'role' que está NO TOKEN (vindo do user_profile) tem permissão
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Se não tem user ou não tem role, nega
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Acesso proibido" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Requer permissão: ${allowedRoles.join(" ou ")}`,
      });
    }

    return next();
  };
}
