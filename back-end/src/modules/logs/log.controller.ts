import { Request, Response } from "express";
import { LogService } from "./log.service";
import { toInt } from "../../shared/utils/validation";
import { AppError } from "../../app/middleware/error.middleware";

export class LogController {
  constructor(private service: LogService) {}

  private getUserLoja(req: Request): string {
    const user = req.user;
    if (!user || !user.lojaId) {
      throw new AppError("Usuário não autenticado ou sem loja vinculada.", 401);
    }
    return user.lojaId;
  }

  // =====================
  // ACCESS LOGS
  // =====================

  getAccessPaginated = async (req: Request, res: Response) => {
    const lojaId = this.getUserLoja(req);
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);

    const result = await this.service.getAccessLogs(lojaId, page, perPage);
    return res.json(result);
  };

  searchAccessPaginated = async (req: Request, res: Response) => {
    const lojaId = this.getUserLoja(req);
    const term = String(req.query.term || "");
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);

    const result = await this.service.searchAccessLogs(
      lojaId,
      term,
      page,
      perPage
    );
    return res.json(result);
  };

  // =====================
  // SYSTEM LOGS
  // =====================

  getSystemPaginated = async (req: Request, res: Response) => {
    const lojaId = this.getUserLoja(req);
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);

    const result = await this.service.getSystemLogs(lojaId, page, perPage);
    return res.json(result);
  };

  searchSystemPaginated = async (req: Request, res: Response) => {
    const lojaId = this.getUserLoja(req);
    const term = String(req.query.term || "");
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);

    const result = await this.service.searchSystemLogs(
      lojaId,
      term,
      page,
      perPage
    );
    return res.json(result);
  };
}
