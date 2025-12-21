import { Request, Response } from "express";
import { UserProfileService } from "./user_profile.service";

export class UserProfileController {
  constructor(private service: UserProfileService) {}

  private getActorId(req: Request): string | undefined {
    return req.user?.userId;
  }

  private getLojaFilter(req: Request): string | undefined {
    const user = req.user;
    if (!user) return undefined;
    if (user.role === "SUPER_ADMIN") return undefined;
    return user.lojaId;
  }

  create = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    // Validação de auth está no service ou middleware, mas podemos checar aqui se necessário
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

    const result = await this.service.updateProfile(req.params.id, {
      ...req.body,
      actorUserId,
    });
    return res.json(result);
  };

  remove = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    if (!actorUserId)
      return res.status(401).json({ error: "Usuário não autenticado." });

    await this.service.deleteProfile(req.params.id, actorUserId);
    return res.status(204).send();
  };

  getById = async (req: Request, res: Response) => {
    const result = await this.service.getProfileById(req.params.id);
    return res.json(result);
  };

  getAll = async (req: Request, res: Response) => {
    const result = await this.service.getAllProfiles();
    return res.json(result);
  };

  getByUserId = async (req: Request, res: Response) => {
    // Aqui mantemos a lógica de tentar filtrar pela loja se o usuário não for SuperAdmin
    // Mas a rota original não explicitava isso no argumento, vamos manter flexível
    // Se quiser impor a loja: this.getLojaFilter(req)
    const result = await this.service.getProfileByUserId(req.params.userId);
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
      query: String(term),
      page: Number(page),
      limit: Number(perPage),
      lojaId: filterLojaId,
    });
    return res.json(result);
  };
}
