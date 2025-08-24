//src/middlewares/ensureAdmin.ts
import { Request, Response, NextFunction } from "express";

export function ensureAdmin(
  request: Request,
  response: Response,
  next: NextFunction
) {
  // Este middleware deve rodar DEPOIS do authMiddleware,
  // então `request.user` já existirá.
  const { user_role } = request.user;

  if (user_role === "admin") {
    // Se for admin, pode seguir para o controller.
    return next();
  }

  // Se não for admin, retorna um erro de "Proibido".
  return response.status(403).json({
    message: "Acesso negado. O usuário não tem permissão de administrador.",
  });
}
