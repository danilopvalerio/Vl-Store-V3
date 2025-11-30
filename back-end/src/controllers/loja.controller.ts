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
  // ============================================================================
  // POST /lojas
  // Cria uma nova loja.
  // Nota: O 'admin_user_id' no body é quem será o dono. O 'actorUserId' é quem está criando (ex: Super Admin).
  // ============================================================================
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreateLojaDTO;

      // Captura quem está logado (Super Admin) para o log de auditoria
      // Se for nulo (criação via script/sem auth), o service trata.
      const actorUserId = req.user?.userId;

      // Validações de Entrada
      if (!isValidString(body.nome))
        return res.status(400).json({ error: "Nome de loja inválido" });

      if (body.admin_user_id && !isValidUUID(body.admin_user_id))
        return res
          .status(400)
          .json({ error: "ID de usuário administrador inválido" });

      // Chama o service passando o ator
      const loja = await lojaService.createLoja(body, actorUserId);

      res.status(201).json(loja as LojaResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // ============================================================================
  // PATCH /lojas/:id
  // Atualiza dados da loja. Exige identificação do usuário logado.
  // ============================================================================
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateLojaDTO;

      // Identificação do responsável pela alteração (Obrigatório)
      const actorUserId = req.user?.userId;

      if (!actorUserId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido" });

      if (body.nome && !isValidString(body.nome))
        return res.status(400).json({ error: "Nome de loja inválido" });

      // Chama o service passando o ator
      const loja = await lojaService.updateLoja(id, body, actorUserId);

      res.json(loja as LojaResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // ============================================================================
  // DELETE /lojas/:id
  // Remove loja. Ação crítica que exige auditoria.
  // ============================================================================
  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const actorUserId = req.user?.userId;

      if (!actorUserId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido" });

      await lojaService.deleteLoja(id, actorUserId);

      res.status(204).send();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // --- MÉTODOS DE LEITURA (Não precisam de actorUserId pois não geram log de sistema) ---

  // GET /lojas/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido" });

      const loja = await lojaService.getLojaById(id);
      if (!loja) return res.status(404).json({ error: "Loja não encontrada" });

      res.json(loja as LojaResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // GET /lojas
  async getAll(req: Request, res: Response) {
    try {
      const lojas = await lojaService.getAllLojas();
      res.json(lojas as LojaResponseDTO[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  }
}
