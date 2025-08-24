//src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

// Dados esperados no payload do JWT (com a role)
interface ITokenPayload {
  id_loja: string;
  user_role: "admin" | "employee"; // Adicionamos a role aqui
  iat: number;
  exp: number;
  sub: string;
}

// O que vamos adicionar à request (com a role)
interface IUserPayload {
  idLoja: string;
  sub: string;
  user_role: "admin" | "employee"; // Adicionamos a role aqui
}

// Faz o TypeScript entender que `request.user` existe e tem a role
declare global {
  namespace Express {
    interface Request {
      user: IUserPayload;
    }
  }
}

export function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Token JWT não fornecido." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as ITokenPayload;

    request.user = {
      idLoja: decoded.id_loja,
      sub: decoded.sub, // pega o subject do token
      user_role: decoded.user_role,
    };

    return next();
  } catch (error) {
    return response.status(401).json({ code: "ACCESS_TOKEN_EXPIRED" });
  }
}
