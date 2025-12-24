// src/app/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AppError } from "./error.middleware";

export const validate =
  (schema: z.ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      return next();
    } catch (error) {
      // Verifica se o erro é do Zod
      if (error instanceof ZodError) {
        // Mapeia as mensagens de erro (issues já tem o tipo correto)
        const messages = error.issues.map((issue) => {
          return `${issue.path.join(".")}: ${issue.message}`;
        });

        // Retorna erro 400
        return next(
          new AppError(`Erro de validação: ${messages.join(", ")}`, 400)
        );
      }

      // Se for outro tipo de erro, passa para frente
      return next(error);
    }
  };
