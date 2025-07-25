// src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

// Interface para os dados que estão DENTRO do token
interface ITokenPayload {
  id_loja: string; // O nome exato que você salvou no SessionService
  iat: number;
  exp: number;
  sub: string;
}

// Interface para o objeto 'user' que vamos anexar à requisição
interface IUserPayload {
  idLoja: string; // O nome que os Controllers esperam.
}

// Isso "ensina" ao TypeScript que o nosso objeto Request agora pode ter uma propriedade 'user'
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
  // 1. Pega o token de dentro dos cookies da requisição
  const { token } = request.cookies;

  // 2. Se não houver um cookie chamado 'token', o usuário não está autenticado
  if (!token) {
    return response.status(401).json({ message: "Token JWT não fornecido." });
  }

  try {
    // 3. Verifica se o token é válido usando nosso segredo
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as ITokenPayload;

    // 4. Pegamos o 'id_loja' de dentro do token decodificado...
    const { id_loja } = decoded;

    // ... e o anexamos ao objeto 'request' com o formato que o controller espera.
    request.user = {
      idLoja: id_loja,
    };

    // 5. Se o token for válido, permite que a requisição continue para o controller
    return next();
  } catch {
    // Se jwt.verify der um erro (token expirado, assinatura inválida), retorna erro.
    return response.status(401).json({ message: "Token JWT inválido." });
  }
}
