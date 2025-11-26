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
  // POST /users
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreateUserDTO;

      if (!isValidEmail(body.email))
        return res.status(400).json({ error: "Invalid e-mail" });

      if (!isValidString(body.senha, 6, 255))
        return res
          .status(400)
          .json({ error: "Invalid password (min 6 chars)" });

      // Validação de Telefones
      if (!isValidPhoneArray(body.telefones)) {
        return res
          .status(400)
          .json({ error: "Invalid phones (Max 2 strings)" });
      }

      const user = await userService.createUser(body);

      // Retorna 201 Created (o objeto user já vem sem senha e com telefones)
      res.status(201).json(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // PATCH /users/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateUserDTO;

      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });
      if (body.email && !isValidEmail(body.email))
        return res.status(400).json({ error: "Invalid e-mail" });
      if (body.senha && !isValidString(body.senha, 6))
        return res.status(400).json({ error: "Invalid password" });

      if (!isValidPhoneArray(body.telefones)) {
        return res
          .status(400)
          .json({ error: "Invalid phones (Max 2 strings)" });
      }

      const user = await userService.updateUser(id, body);
      res.json(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // DELETE /users/:id
  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });

      await userService.deleteUser(id);
      res.status(204).send();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // GET /users/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });

      const user = await userService.getUserById(id);
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // GET /users
  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      res.status(500).json({ error: msg });
    }
  }

  private getLojaFilter(req: Request): string | undefined {
    const user = req.user;
    if (!user) return undefined;

    // SUPER_ADMIN vê tudo (undefined)
    if (user.role === "SUPER_ADMIN") {
      return undefined;
    }

    // ADMIN ou GERENTE vê apenas usuários que tenham vínculo com a loja deles
    return user.lojaId;
  }

  // GET /users/paginated
  async getPaginated(req: Request, res: Response) {
    try {
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      // Filtro de segurança
      const filterLojaId = this.getLojaFilter(req);

      if (page <= 0 || perPage <= 0)
        return res.status(400).json({ error: "Invalid pagination parameters" });

      const result = await userService.getUsersPaginated(
        page,
        perPage,
        filterLojaId
      );
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      res.status(500).json({ error: msg });
    }
  }

  // GET /users/search
  async searchPaginated(req: Request, res: Response) {
    try {
      const term = (req.query.term as string | undefined) ?? "";
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      // Filtro de segurança
      const filterLojaId = this.getLojaFilter(req);

      if (!isValidString(term))
        return res
          .status(400)
          .json({ error: "The 'term' parameter is required" });

      const result = await userService.searchUsers(
        term,
        page,
        perPage,
        filterLojaId
      );
      return res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      return res.status(500).json({ error: msg });
    }
  }
}
