// src/modules/sale/venda.controller.ts
import { Request, Response } from "express";
import { VendaService } from "./venda.service";
import { CreateVendaDTO, UpdateStatusDTO } from "./venda.dto";
import { toInt, isValidUUID } from "../../shared/utils/validation";
import { AppError } from "../../app/middleware/error.middleware";

export class VendaController {
  constructor(private service: VendaService) {}

  private getActor(req: Request) {
    if (!req.user?.userId) throw new AppError("Auth Error", 401);
    return {
      userId: req.user.userId,
      lojaId: req.user.lojaId,
      role: req.user.role,
    };
  }

  create = async (req: Request, res: Response) => {
    const body = req.body as CreateVendaDTO;
    const actor = this.getActor(req);

    const lojaId = actor.role === "SUPER_ADMIN" ? body.id_loja : actor.lojaId;

    if (!lojaId) throw new AppError("Loja não identificada", 400);

    const result = await this.service.createVenda({
      ...body,
      id_loja: lojaId,
      actorUserId: actor.userId,
    });

    return res.status(201).json(result);
  };

  updateStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateStatusDTO;
    const actor = this.getActor(req);

    if (!isValidUUID(id)) throw new AppError("ID Inválido");

    await this.service.mudarStatus(id, {
      status: body.status,
      actorUserId: actor.userId,
    });

    return res.status(200).send();
  };

  getById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidUUID(id)) throw new AppError("ID Inválido");
    return res.json(await this.service.getById(id));
  };

  getPaginated = async (req: Request, res: Response) => {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const actor = this.getActor(req);

    const lojaId = actor.role === "SUPER_ADMIN" ? undefined : actor.lojaId;

    return res.json(await this.service.getPaginated(page, limit, lojaId));
  };

  getItens = async (req: Request, res: Response) => {
    const { id } = req.params;
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);

    if (!isValidUUID(id)) throw new AppError("ID Inválido");

    return res.json(await this.service.getItensPaginated(id, page, limit));
  };

  searchPaginated = async (req: Request, res: Response) => {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const term = String(req.query.term || "");
    const actor = this.getActor(req);

    const lojaId = actor.role === "SUPER_ADMIN" ? undefined : actor.lojaId;

    return res.json(
      await this.service.searchPaginated(term, page, limit, lojaId)
    );
  };

  addPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    // Tipamos o body conforme o schema, mas pegando apenas a parte de pagamentos
    const body = req.body as {
      pagamentos: { tipo_pagamento: string; valor: number }[];
    };
    const actor = this.getActor(req);

    if (!isValidUUID(id)) throw new AppError("ID Inválido");

    const result = await this.service.addPayment(id, {
      pagamentos: body.pagamentos,
      actorUserId: actor.userId,
    });

    return res.status(200).json(result);
  };
}
