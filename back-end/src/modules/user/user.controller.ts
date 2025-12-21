import { Request, Response } from "express";
import { UserService } from "./user.service";
import { AppError } from "../../app/middleware/error.middleware";
import { toInt } from "../../shared/utils/validation";

export class UserController {
  constructor(private service: UserService) {}

  private getActorId(req: Request): string {
    const id = req.user?.userId;
    if (!id) throw new AppError("Usuário não autenticado.", 401);
    return id;
  }

  create = async (req: Request, res: Response) => {
    const actorId = this.getActorId(req);
    const result = await this.service.createUser(req.body, actorId);
    return res.status(201).json(result);
  };

  update = async (req: Request, res: Response) => {
    const actorId = this.getActorId(req);
    const { id } = req.params;
    const result = await this.service.updateUser(id, req.body, actorId);
    return res.json(result);
  };

  delete = async (req: Request, res: Response) => {
    const actorId = this.getActorId(req);
    const { id } = req.params;
    await this.service.deleteUser(id, actorId);
    return res.status(204).send();
  };

  getById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.service.getUserById(id);
    return res.json(result);
  };

  listPaginated = async (req: Request, res: Response) => {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const result = await this.service.listPaginated(page, limit);
    return res.json(result);
  };

  searchPaginated = async (req: Request, res: Response) => {
    const term = String(req.query.term || "");
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const result = await this.service.searchPaginated(term, page, limit);
    return res.json(result);
  };
}
