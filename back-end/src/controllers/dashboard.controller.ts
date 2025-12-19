// src/controllers/dashboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  private service: DashboardService;

  constructor() {
    this.service = new DashboardService();
  }

  // Graças ao seu .d.ts, o TS sabe que 'req' tem a propriedade 'user'
  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // O 'user' é opcional (?) no seu d.ts, então usamos Optional Chaining
      // Se não tiver user ou lojaId, retornamos erro 401
      if (!req.user?.lojaId) {
        return res.status(401).json({
          error: "Usuário não autenticado ou sem loja vinculada.",
        });
      }

      // O TypeScript reconhece req.user.lojaId como string aqui
      const summary = await this.service.getSummary(req.user.lojaId);

      return res.json(summary);
    } catch (error) {
      next(error);
    }
  };
}
