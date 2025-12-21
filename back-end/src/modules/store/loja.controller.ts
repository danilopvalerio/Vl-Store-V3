import { Request, Response } from "express";
import { LojaService } from "./loja.service";

export class LojaController {
  constructor(private service: LojaService) {}

  private getActorId(req: Request): string | undefined {
    return req.user?.userId;
  }

  create = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    const result = await this.service.createLoja({ ...req.body, actorUserId });
    return res.status(201).json(result);
  };

  update = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    if (!actorUserId)
      return res.status(401).json({ error: "Usuário não autenticado." });

    const result = await this.service.updateLoja(req.params.id, {
      ...req.body,
      actorUserId,
    });
    return res.json(result);
  };

  remove = async (req: Request, res: Response) => {
    const actorUserId = this.getActorId(req);
    if (!actorUserId)
      return res.status(401).json({ error: "Usuário não autenticado." });

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
