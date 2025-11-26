//src/controllers/loja.controller.ts
import { Request, Response } from "express";
import { LojaService } from "../services/loja.service";
import {
  CreateLojaDTO,
  UpdateLojaDTO,
  LojaResponseDTO,
} from "../dtos/loja.dto";
import { isValidUUID, isValidString } from "../utils/validation";

const lojaService = new LojaService();

export class LojaController {
  // POST /lojas
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreateLojaDTO;

      // Validações de Entrada
      if (!isValidString(body.nome))
        return res.status(400).json({ error: "Invalid store name" });

      if (body.admin_user_id && !isValidUUID(body.admin_user_id))
        return res.status(400).json({ error: "Invalid Admin User ID" });

      const loja = await lojaService.createLoja(body);

      // Retorna 201 Created
      res.status(201).json(loja as LojaResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // PATCH /lojas/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateLojaDTO;

      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });

      // Se enviou nome, tem que ser string válida
      if (body.nome && !isValidString(body.nome))
        return res.status(400).json({ error: "Invalid store name" });

      const loja = await lojaService.updateLoja(id, body);
      res.json(loja as LojaResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // DELETE /lojas/:id
  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });

      await lojaService.deleteLoja(id);
      res.status(204).send();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // GET /lojas/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });

      const loja = await lojaService.getLojaById(id);
      if (!loja) return res.status(404).json({ error: "Store not found" });

      res.json(loja as LojaResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // GET /lojas
  async getAll(req: Request, res: Response) {
    try {
      const lojas = await lojaService.getAllLojas();
      res.json(lojas as LojaResponseDTO[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      res.status(500).json({ error: msg });
    }
  }
}
