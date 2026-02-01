import { Request, Response } from "express";
import { UserProfileService } from "./user_profile.service";

export class UserProfileController {
  constructor(private service: UserProfileService) {}

  private getActorId(req: Request): string | undefined {
    return req.user?.userId;
  }

  private getActorRole(req: Request): string | undefined {
    return req.user?.role;
  }

  private getLojaFilter(req: Request): string | undefined {
    const user = req.user;
    if (!user) return undefined;
    if (user.role === "SUPER_ADMIN") return undefined;
    return user.lojaId;
  }

  // --- CORREÇÃO AQUI ---
  getAvatar = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    const actorRole = this.getActorRole(req);

    // Forçamos o tipo aqui com 'as string'
    const profileId = req.params.id as string;

    if (!actorUserId)
      return res.status(401).json({ error: "Autenticação necessária" });

    const filePath = await this.service.getProfileAvatarPath(
      profileId,
      actorUserId,
      actorRole,
    );

    return res.sendFile(filePath);
  };

  create = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    if (!actorUserId)
      return res.status(401).json({ error: "Usuário não autenticado." });

    const result = await this.service.createProfile({
      ...req.body,
      actorUserId,
    });
    return res.status(201).json(result);
  };

  update = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    if (!actorUserId)
      return res.status(401).json({ error: "Usuário não autenticado." });

    // --- CORREÇÃO AQUI ---
    const result = await this.service.updateProfile(req.params.id as string, {
      ...req.body,
      actorUserId,
    });
    return res.json(result);
  };

  remove = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    if (!actorUserId)
      return res.status(401).json({ error: "Usuário não autenticado." });

    // --- CORREÇÃO AQUI ---
    await this.service.deleteProfile(req.params.id as string, actorUserId);
    return res.status(204).send();
  };

  getById = async (req: Request, res: Response) => {
    // --- CORREÇÃO AQUI ---
    const result = await this.service.getProfileById(req.params.id as string);
    return res.json(result);
  };

  getAll = async (req: Request, res: Response) => {
    const result = await this.service.getAllProfiles();
    return res.json(result);
  };

  getByUserId = async (req: Request, res: Response) => {
    // --- CORREÇÃO AQUI ---
    // Note que aqui o parametro chama 'userId' conforme definido na rota /user/:userId
    const result = await this.service.getProfileByUserId(
      req.params.userId as string,
    );
    return res.json(result);
  };

  getPaginated = async (req: Request, res: Response) => {
    const { page = 1, perPage = 10 } = req.query;
    const filterLojaId = this.getLojaFilter(req);
    const result = await this.service.getProfilesPaginated({
      page: Number(page),
      limit: Number(perPage),
      lojaId: filterLojaId,
    });
    return res.json(result);
  };

  searchPaginated = async (req: Request, res: Response) => {
    const { term = "", page = 1, perPage = 10 } = req.query;
    const filterLojaId = this.getLojaFilter(req);
    const result = await this.service.searchProfiles({
      // Converter explicitamente para String garante que não seja array ou undefined
      query: String(term),
      page: Number(page),
      limit: Number(perPage),
      lojaId: filterLojaId,
    });
    return res.json(result);
  };
}
