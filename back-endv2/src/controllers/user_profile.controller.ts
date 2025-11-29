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
  // ============================================================================
  // POST /profiles
  // Cria vínculo de perfil. Registra quem fez a contratação.
  // ============================================================================
  async create(req: Request, res: Response) {
    try {
      const body = req.body as CreateUserProfileDTO;

      // Captura o ID do Admin/Gerente logado
      const actorUserId = req.user?.userId;

      if (!actorUserId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      // Validações
      if (!isValidUUID(body.user_id))
        return res.status(400).json({ error: "Invalid User ID" });
      if (!isValidUUID(body.id_loja))
        return res.status(400).json({ error: "Invalid Store ID" });
      if (!isValidString(body.nome))
        return res.status(400).json({ error: "Invalid name" });

      // Passa o ator para o service
      const profile = await profileService.createProfile(body, actorUserId);

      res.status(201).json(profile as UserProfileResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // ============================================================================
  // PATCH /profiles/:id
  // Atualiza cargo ou tipo. Registra a alteração.
  // ============================================================================
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateUserProfileDTO;
      const actorUserId = req.user?.userId;

      if (!actorUserId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido" });

      if (body.nome && !isValidString(body.nome))
        return res.status(400).json({ error: "Nome inválido" });

      const profile = await profileService.updateProfile(id, body, actorUserId);

      res.json(profile as UserProfileResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // ============================================================================
  // DELETE /profiles/:id
  // Remove perfil.
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

      await profileService.deleteProfile(id, actorUserId);

      res.status(204).send();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  // --- MÉTODOS DE LEITURA E FILTRAGEM ---

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!isValidUUID(id))
        return res.status(400).json({ error: "ID inválido" });

      const profile = await profileService.getProfileById(id);
      if (!profile)
        return res.status(404).json({ error: "Perfil não encontrado" });

      res.json(profile as UserProfileResponseDTO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const profiles = await profileService.getAllProfiles();
      res.json(profiles as UserProfileResponseDTO[]);
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

      const result = await profileService.getProfilesPaginated(
        page,
        perPage,
        filterLojaId
      );

      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro interno";
      res.status(500).json({ error: msg });
    }
  }

  // GET /profiles/user/:userId
  async getByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!isValidUUID(userId))
        return res.status(400).json({ error: "ID de usuário inválido." });

      const profile = await profileService.getProfileByUserId(userId);

      if (!profile) {
        // Retorna 404 se o usuário não tiver perfil (ainda não contratado)
        return res
          .status(404)
          .json({ error: "Perfil não encontrado para este usuário." });
      }

      res.json(profile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      res.status(400).json({ error: msg });
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

      const result = await profileService.searchProfiles(
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
