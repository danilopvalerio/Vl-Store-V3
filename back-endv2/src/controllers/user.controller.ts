// src/controllers/user.controller.ts
import { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class UserController {
  async create(req: Request, res: Response) {
    try {
      const { email, senha, role } = req.body;
      if (!email || !senha)
        return res.status(400).json({ error: "email and senha are required" });

      const user = await userService.createUser(email, senha, role);
      const { senha_hash, ...rest } = user as any;
      res.status(201).json(rest);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const user = await userService.updateUser(id, payload);
      const { senha_hash, ...rest } = user as any;
      res.json(rest);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { senha_hash, ...rest } = user as any;
      res.json(rest);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      const safe = users.map((u: any) => {
        const { senha_hash, ...rest } = u;
        return rest;
      });
      res.json(safe);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getPaginated(req: Request, res: Response) {
    try {
      const page = parseInt((req.query.page as string) ?? "1", 10);
      const perPage = parseInt((req.query.perPage as string) ?? "10", 10);
      const result = await userService.getUsersPaginated(page, perPage);

      // Removendo hash da senha dos resultados
      result.data = result.data.map((u: any) => {
        const { senha_hash, ...rest } = u;
        return rest;
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async searchPaginated(req: Request, res: Response) {
    try {
      const term = (req.query.term as string | undefined) ?? "";
      const page = parseInt((req.query.page as string) ?? "1", 10);
      const perPage = parseInt((req.query.perPage as string) ?? "10", 10);

      if (!term || term.trim() === "") {
        return res.status(400).json({
          error: "O parâmetro 'term' é obrigatório",
        });
      }

      const result = await userService.searchUsers(term, page, perPage);

      // Removendo hash da senha da busca também
      result.data = result.data.map((u: any) => {
        const { senha_hash, ...rest } = u;
        return rest;
      });

      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha)
        return res.status(400).json({ error: "email and senha required" });

      const user = await userService.authenticate(email, senha);
      const { senha_hash, ...rest } = user as any;
      res.json(rest);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }
}
