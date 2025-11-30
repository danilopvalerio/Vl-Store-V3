import { Request, Response } from "express";
import { LogService } from "../services/log.service";
import { toInt, isValidString } from "../utils/validation";
import { TokenPayload } from "../utils/jwt"; // Importe sua interface do JWT

const logService = new LogService();

// Interface auxiliar para o TypeScript entender que existe 'user' na requisição
interface AuthRequest extends Request {
  user?: TokenPayload;
}

export class LogController {
  // =====================
  // ACCESS LOGS
  // =====================

  // GET /logs/access
  async getAccessPaginated(req: Request, res: Response) {
    try {
      // 1. Pega o ID da loja direto do Token decodificado (req.user)
      const user = (req as AuthRequest).user;

      if (!user || !user.lojaId) {
        return res
          .status(401)
          .json({ error: "Usuário não autenticado ou sem loja vinculada." });
      }

      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      // 2. Passa o lojaId do token para o service
      const result = await logService.getAccessLogs(user.lojaId, page, perPage);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao buscar logs";
      res.status(500).json({ error: msg });
    }
  }

  // GET /logs/access/search
  async searchAccessPaginated(req: Request, res: Response) {
    try {
      const user = (req as AuthRequest).user;

      if (!user || !user.lojaId) {
        return res.status(401).json({ error: "Acesso negado." });
      }

      const term = (req.query.term as string | undefined) ?? "";
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      if (!isValidString(term)) {
        const result = await logService.getAccessLogs(
          user.lojaId,
          page,
          perPage
        );
        return res.json(result);
      }

      const result = await logService.searchAccessLogs(
        user.lojaId,
        term,
        page,
        perPage
      );
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
      const user = (req as AuthRequest).user;

      if (!user || !user.lojaId) {
        return res.status(401).json({ error: "Acesso negado." });
      }

      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      const result = await logService.getSystemLogs(user.lojaId, page, perPage);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao buscar logs";
      res.status(500).json({ error: msg });
    }
  }

  // GET /logs/system/search
  async searchSystemPaginated(req: Request, res: Response) {
    try {
      const user = (req as AuthRequest).user;

      if (!user || !user.lojaId) {
        return res.status(401).json({ error: "Acesso negado." });
      }

      const term = (req.query.term as string | undefined) ?? "";
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      const result = await logService.searchSystemLogs(
        user.lojaId,
        term,
        page,
        perPage
      );
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao buscar logs";
      res.status(500).json({ error: msg });
    }
  }
}
