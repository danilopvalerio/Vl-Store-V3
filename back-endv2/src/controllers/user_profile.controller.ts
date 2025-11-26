//src/controllers/user_profile.controller.ts
import { Request, Response } from "express";
import { UserProfileService } from "../services/user_profile.service";
import {
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
  UserProfileResponseDTO,
} from "../dtos/user_profile.dto";
import { isValidUUID, isValidString, toInt } from "../utils/validation";

const profileService = new UserProfileService();

export class UserProfileController {
  // POST /profiles
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreateUserProfileDTO;

      // Validações obrigatórias
      if (!isValidUUID(body.user_id))
        return res.status(400).json({ error: "Invalid User ID" });
      if (!isValidUUID(body.id_loja))
        return res.status(400).json({ error: "Invalid Store ID" });
      if (!isValidString(body.nome))
        return res.status(400).json({ error: "Invalid name" });

      const profile = await profileService.createProfile(body);

      // 201 Created
      res.status(201).json(profile as UserProfileResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // PATCH /profiles/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateUserProfileDTO;

      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });

      // Se enviou nome, valida se não está vazio
      if (body.nome && !isValidString(body.nome))
        return res.status(400).json({ error: "Invalid name" });

      const profile = await profileService.updateProfile(id, body);
      res.json(profile as UserProfileResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // DELETE /profiles/:id
  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });

      await profileService.deleteProfile(id);

      // 204 No Content
      res.status(204).send();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // GET /profiles/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "Invalid ID" });

      const profile = await profileService.getProfileById(id);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      res.json(profile as UserProfileResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      res.status(400).json({ error: msg });
    }
  }

  // GET /profiles
  async getAll(req: Request, res: Response) {
    try {
      const profiles = await profileService.getAllProfiles();
      res.json(profiles as UserProfileResponseDTO[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      res.status(500).json({ error: msg });
    }
  }

  private getLojaFilter(req: Request): string | undefined {
    const user = req.user; // Injetado pelo authMiddleware
    if (!user) return undefined; // Segurança

    // Se for SUPER_ADMIN, retorna undefined (sem filtro, vê tudo)
    if (user.role === "SUPER_ADMIN") {
      return undefined;
    }

    // Se for ADMIN ou GERENTE, retorna o ID da loja dele
    return user.lojaId;
  }

  // GET /profiles/paginated
  async getPaginated(req: Request, res: Response) {
    try {
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      // Obtém o ID da loja para filtrar (ou undefined se for Super Admin)
      const filterLojaId = this.getLojaFilter(req);

      if (page <= 0 || perPage <= 0)
        return res.status(400).json({ error: "Invalid pagination parameters" });

      const result = await profileService.getProfilesPaginated(
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

  // GET /profiles/search
  async searchPaginated(req: Request, res: Response) {
    try {
      const term = (req.query.term as string | undefined) ?? "";
      const page = toInt(req.query.page, 1);
      const perPage = toInt(req.query.perPage, 10);

      // Obtém o ID da loja para filtrar
      const filterLojaId = this.getLojaFilter(req);

      if (!isValidString(term))
        return res
          .status(400)
          .json({ error: "The 'term' parameter is required" });

      const result = await profileService.searchProfiles(
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
