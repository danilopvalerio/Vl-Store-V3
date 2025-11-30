import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Se for um erro que a gente conhece (AppError), manda a mensagem bonitinha
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Se for erro do próprio javascript/banco que não tratamos
  console.error("Erro interno:", err); // Loga no terminal para você ver

  return res.status(500).json({
    status: "error",
    message: "Erro interno do servidor",
  });
}
