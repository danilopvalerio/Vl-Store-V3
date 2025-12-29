import { Request, Response } from "express";
import { LojaService } from "./loja.service";
import { CreateLojaDTO, UpdateLojaDTO } from "./loja.dto";

export class LojaController {
  constructor(private service: LojaService) {}

  private getActorId(req: Request): string | undefined {
    return req.user?.userId;
  }

  create = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);

    // Injeta o ID do usuário logado como 'admin_user_id' e 'actorUserId'
    const body: CreateLojaDTO = {
      ...req.body,
      admin_user_id: actorUserId, // O usuário logado SERÁ o dono da nova loja
      actorUserId,
    };

    const result = await this.service.createLoja(body);
    return res.status(201).json(result);
  };

  update = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    const body: UpdateLojaDTO = { ...req.body, actorUserId };

    const result = await this.service.updateLoja(req.params.id, body);
    return res.json(result);
  };

  remove = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    if (!actorUserId) return res.status(401).json({ error: "Auth required" });

    await this.service.deleteLoja(req.params.id, actorUserId);
    return res.status(204).send();
  };

  getById = async (req: Request, res: Response) => {
    const result = await this.service.getLojaById(req.params.id);
    return res.json(result);
  };

  getAll = async (req: Request, res: Response) => {
    const result = await this.service.getAllLojas();
    return res.json(result);
  };
}
