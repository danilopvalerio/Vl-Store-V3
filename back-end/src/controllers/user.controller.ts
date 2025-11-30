import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { CreateUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import {
  isValidEmail,
  isValidUUID,
  isValidString,
  isValidPhoneArray,
  toInt,
} from "../utils/validation";

const userService = new UserService();

export class UserController {
  // ============================================================================
  // POST /users
  // Cria conta de acesso.
  // ============================================================================
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreateUserDTO;

      // Captura quem está criando (para o log de sistema)
      const actorUserId = req.user?.userId;

      if (!isValidEmail(body.email))
        return res.status(400).json({ error: "E-mail inválido." });

      if (!isValidString(body.senha, 6, 255))
        return res
          .status(400)
          .json({ error: "Senha inválida (mínimo 6 caracteres)" });

      if (!body.telefones || body.telefones.length === 0) {
        body.telefones = [];
      } else {
        if (!isValidPhoneArray(body.telefones)) {
          return res
            .status(400)
            .json({ error: "Telefones inválidos (máximo 2 strings)" });
        }
      }

      // Passa o ator para o service
      const user = await userService.createUser(body, actorUserId);

      res.status(201).json(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // ============================================================================
  // PATCH /users/:id
  // Atualiza email/senha.
  // ============================================================================
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateUserDTO;
      const actorUserId = req.user?.userId;

      if (!actorUserId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido" });

      if (body.email && !isValidEmail(body.email))
        return res.status(400).json({ error: "E-mail inválido." });

      if (body.senha && !isValidString(body.senha, 6))
        return res
          .status(400)
          .json({ error: "Senha inválida (mínimo 6 caracteres)" });

      if (!isValidPhoneArray(body.telefones)) {
        return res
          .status(400)
          .json({ error: "Telefones inválidos (máximo 2 strings)" });
      }

      // Passa o ator para o service
      const user = await userService.updateUser(id, body, actorUserId);
      res.json(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // ============================================================================
  // DELETE /users/:id
  // Remove conta.
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

      await userService.deleteUser(id, actorUserId);

      res.status(204).send();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // --- LEITURAS ---

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido" });

      const user = await userService.getUserById(id);
      if (!user)
        return res.status(404).json({ error: "Usuário não encontrado" });

      res.json(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  }

  private getLojaFilter(req: Request): string | undefined {
    const user = req.user;
    if (!user) return undefined;

    if (user.role === "SUPER_ADMIN") {
      return undefined;
    }
    return user.lojaId;
  }

  async getPaginated(req: Request, res: Response) {
    try {
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);
      const filterLojaId = this.getLojaFilter(req);

      if (page <= 0 || perPage <= 0)
        return res
          .status(400)
          .json({ error: "Parâmetros de paginação inválidos" });

      const result = await userService.getUsersPaginated(
        page,
        perPage,
        filterLojaId
      );
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno.";
      res.status(500).json({ error: msg });
    }
  }

  async searchPaginated(req: Request, res: Response) {
    try {
      const term = (req.query.term as string | undefined) ?? "";
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);
      const filterLojaId = this.getLojaFilter(req);

      if (!isValidString(term))
        return res
          .status(400)
          .json({ error: "O parâmetro 'term' é obrigatório" });

      const result = await userService.searchUsers(
        term,
        page,
        perPage,
        filterLojaId
      );
      return res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      return res.status(500).json({ error: msg });
    }
  }
}
