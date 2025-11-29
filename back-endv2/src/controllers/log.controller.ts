// src/controllers/log.controller.ts
import { Request, Response } from "express";
import { LogService } from "../services/log.service";
import { toInt, isValidString } from "../utils/validation";

const logService = new LogService();

export class LogController {
  // =====================
  // ACCESS LOGS
  // =====================

  // GET /logs/access
  async getAccessPaginated(req: Request, res: Response) {
    try {
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      const result = await logService.getAccessLogs(page, perPage);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao buscar logs";
      res.status(500).json({ error: msg });
    }
  }

  // GET /logs/access/search
  async searchAccessPaginated(req: Request, res: Response) {
    try {
      const term = (req.query.term as string | undefined) ?? "";
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      if (!isValidString(term)) {
        // Se não mandou termo, retorna paginado normal ou erro, depende da sua regra.
        // Aqui vou redirecionar para o get normal
        const result = await logService.getAccessLogs(page, perPage);
        return res.json(result);
      }

      const result = await logService.searchAccessLogs(term, page, perPage);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao buscar logs";
      res.status(500).json({ error: msg });
    }
  }

  // =====================
  // SYSTEM LOGS
  // =====================

  // GET /logs/system
  async getSystemPaginated(req: Request, res: Response) {
    try {
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      const result = await logService.getSystemLogs(page, perPage);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao buscar logs";
      res.status(500).json({ error: msg });
    }
  }

  // GET /logs/system/search
  async searchSystemPaginated(req: Request, res: Response) {
    try {
      const term = (req.query.term as string | undefined) ?? "";
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      const result = await logService.searchSystemLogs(term, page, perPage);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao buscar logs";
      res.status(500).json({ error: msg });
    }
  }
}
