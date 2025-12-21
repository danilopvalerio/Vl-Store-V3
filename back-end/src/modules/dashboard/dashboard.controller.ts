import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { AppError } from "../../app/middleware/error.middleware";

export class DashboardController {
  constructor(private service: DashboardService) {}

  private getLojaId(req: Request): string {
    const lojaId = req.user?.lojaId;
    if (!lojaId) {
      throw new AppError("Usuário não autenticado ou sem loja vinculada.", 401);
    }
    return lojaId;
  }

  getSummary = async (req: Request, res: Response) => {
    // Se getLojaId falhar, lança AppError que sobe para o middleware
    const lojaId = this.getLojaId(req);

    const summary = await this.service.getSummary(lojaId);
    return res.json(summary);
  };
}
