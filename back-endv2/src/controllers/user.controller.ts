import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
} from "../dtos/user.dto";

import { user as User } from "../generated/prisma/client";
import {
  isValidEmail,
  isValidUUID,
  isValidString,
  toInt,
} from "../utils/validation";

const userService = new UserService();

// --- HELPER FUNCTION ---
// Função auxiliar para converter o User do banco (com senha)
// para o DTO de resposta (sem senha).
// Isso evita que a gente esqueça e mande a senha_hash pro frontend.
function toResponseDTO(user: User): UserResponseDTO {
  const { senha_hash, ...rest } = user; // "Tira a senha e guarda o resto em 'rest'"
  return rest;
}

export class UserController {
  // POST /users
  async create(req: Request, res: Response) {
    try {
      // TypeScript entende que req.body deve parecer com CreateUserDTO
      const body = req.body as CreateUserDTO;

      // 1. Validações de Entrada (Se falhar aqui, nem chama o banco)
      if (!isValidEmail(body.email))
        return res.status(400).json({ error: "Invalid e-mail" });

      if (!isValidString(body.senha, 6, 255))
        return res
          .status(400)
          .json({ error: "Invalid password (min 6 chars)" });

      if (body.role && !isValidString(body.role))
        return res.status(400).json({ error: "Invalid role" });

      // 2. Chama o serviço para criar
      const user = await userService.createUser(body);

      // 3. Retorna sucesso (201 Created) e os dados limpos (sem senha)
      res.status(201).json(toResponseDTO(user));
    } catch (err) {
      // Se deu erro no service (ex: email duplicado), cai aqui.
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // PATCH /users/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params; // Pega o ID da URL
      const body = req.body as UpdateUserDTO;

      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });

      // Validações condicionais: Só valida o e-mail se o usuário mandou um e-mail novo
      if (body.email && !isValidEmail(body.email))
        return res.status(400).json({ error: "Invalid e-mail" });

      if (body.senha && !isValidString(body.senha, 6, 255))
        return res.status(400).json({ error: "Invalid password" });

      const user = await userService.updateUser(id, body);
      res.json(toResponseDTO(user)); // Retorna 200 OK por padrão
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

      // 204 No Content: Deu certo, mas não tenho nada para te mostrar de volta.
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

      res.json(toResponseDTO(user));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // GET /users
  async getAll(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      // .map percorre o array de usuários e aplica a função de limpeza em cada um
      res.json(users.map(toResponseDTO));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      res.status(500).json({ error: msg });
    }
  }

  // GET /users/paginated?page=1&perPage=10
  async getPaginated(req: Request, res: Response) {
    try {
      // Converte query string ("1") para número (1)
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      if (page <= 0 || perPage <= 0)
        return res.status(400).json({ error: "Invalid pagination parameters" });

      const result = await userService.getUsersPaginated(page, perPage);

      // Precisamos limpar a lista 'data' dentro do objeto de paginação
      const response = {
        ...result,
        data: result.data.map(toResponseDTO), // Limpa as senhas aqui
      };

      res.json(response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      res.status(500).json({ error: msg });
    }
  }

  // GET /users/search?term=danilo
  async searchPaginated(req: Request, res: Response) {
    try {
      const term = (req.query.term as string | undefined) ?? "";
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      if (!isValidString(term))
        return res
          .status(400)
          .json({ error: "The 'term' parameter is required" });

      const result = await userService.searchUsers(term, page, perPage);

      const response = {
        ...result,
        data: result.data.map(toResponseDTO),
      };

      return res.json(response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      return res.status(500).json({ error: msg });
    }
  }

  // POST /users/login
  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      if (!isValidEmail(email))
        return res.status(400).json({ error: "Invalid e-mail" });
      if (!isValidString(senha))
        return res.status(400).json({ error: "Invalid password" });

      const user = await userService.authenticate(email, senha);
      res.json(toResponseDTO(user)); // Retorna os dados do user logado (sem senha)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      // 401 Unauthorized: Usuário ou senha errados
      res.status(401).json({ error: msg });
    }
  }
}
