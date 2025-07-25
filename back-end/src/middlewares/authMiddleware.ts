// src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

// Dados esperados no payload do JWT
interface ITokenPayload {
  id_loja: string;
  iat: number;
  exp: number;
  sub: string;
}

// O que vamos adicionar à request
interface IUserPayload {
  idLoja: string;
}

// Faz o TypeScript entender que `request.user` existe
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
  // 1. Pega o token do header Authorization (padrão Bearer Token)
  const authHeader = request.headers.authorization;

  // 2. Verifica se o header está presente e no formato correto
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Token JWT não fornecido." });
  }

  // 3. Extrai o token do header
  const token = authHeader.replace("Bearer ", "");

  try {
    // 4. Verifica e decodifica o token
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as ITokenPayload;

    // 5. Extrai o ID da loja e anexa à requisição
    request.user = {
      idLoja: decoded.id_loja,
    };

    // 6. Passa para o próximo middleware ou controller
    return next();
  } catch (error) {
    return response
      .status(401)
      .json({ message: "Token JWT inválido ou expirado." });
  }
}
