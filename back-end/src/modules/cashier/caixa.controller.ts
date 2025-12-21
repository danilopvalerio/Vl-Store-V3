import { Request, Response } from "express";
import { CaixaService, UserActor } from "./caixa.service";
import {
  CreateCaixaDTO,
  ToggleCaixaStatusDTO,
  UpdateCaixaUserDTO,
  CreateMovimentacaoDTO,
  UpdateMovimentacaoDTO,
} from "./caixa.dto";
import { toInt, isValidUUID } from "../../shared/utils/validation";
import { AppError } from "../../app/middleware/error.middleware";

export class CaixaController {
  constructor(private service: CaixaService) {}

  private getActor(req: Request): UserActor {
    if (!req.user || !req.user.userId) {
      throw new AppError("Usuário não autenticado.", 401);
    }
    return {
      id: req.user.userId,
      role: req.user.role,
      lojaId: req.user.lojaId,
    };
  }

  private getLojaFilter(req: Request): string | undefined {
    return req.user?.role === "SUPER_ADMIN" ? undefined : req.user?.lojaId;
  }

  getCurrentUserCaixa = async (req: Request, res: Response) => {
    const actor = this.getActor(req);
    const caixa = await this.service.buscarCaixaAtivoUsuario(
      actor.id,
      actor.lojaId
    );
    return res.json(caixa);
  };

  openCaixa = async (req: Request, res: Response) => {
    const body = req.body as CreateCaixaDTO;
    const actor = this.getActor(req);
    const result = await this.service.abrirCaixa(body, actor);
    return res.status(201).json(result);
  };

  getPaginated = async (req: Request, res: Response) => {
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);
    const term = req.query.term as string | undefined;
    const lojaId = this.getLojaFilter(req);

    const result = await this.service.listarOuBuscar(
      page,
      perPage,
      lojaId,
      term
    );
    return res.json(result);
  };

  toggleCaixaStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as ToggleCaixaStatusDTO;
    const actor = this.getActor(req);

    if (!isValidUUID(id)) throw new AppError("ID Inválido");

    const result = await this.service.alterarStatus(id, body, actor.id);
    return res.json(result);
  };

  updateResponsible = async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateCaixaUserDTO;
    const actor = this.getActor(req);

    if (!isValidUUID(id)) throw new AppError("ID Inválido");

    const result = await this.service.trocarResponsavel(id, {
      ...body,
      actorUserId: actor.id,
    });
    return res.json(result);
  };

  getCaixaById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidUUID(id)) throw new AppError("ID Inválido");

    const result = await this.service.buscarPorId(id);
    return res.json(result);
  };

  getDashboardInfo = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!isValidUUID(id)) throw new AppError("ID Inválido");

    const result = await this.service.getDashboardStats(id);
    return res.json(result);
  };

  addMovimentacao = async (req: Request, res: Response) => {
    const actor = this.getActor(req);
    const body = req.body as CreateMovimentacaoDTO;
    const result = await this.service.adicionarMovimentacaoManual(body, actor);
    return res.status(201).json(result);
  };

  updateMovimentacao = async (req: Request, res: Response) => {
    const { id } = req.params;
    const actor = this.getActor(req);
    const body = req.body as UpdateMovimentacaoDTO;

    if (!isValidUUID(id)) throw new AppError("ID Inválido");

    const result = await this.service.atualizarMovimentacao(id, body, actor.id);
    return res.json(result);
  };

  deleteMovimentacao = async (req: Request, res: Response) => {
    const { id } = req.params;
    const actor = this.getActor(req);

    if (!isValidUUID(id)) throw new AppError("ID Inválido");

    await this.service.deletarMovimentacao(id, actor.id);
    return res.status(204).send();
  };

  getMovimentacoesPaginated = async (req: Request, res: Response) => {
    const page = toInt(req.query.page, 1);
    const perPage = toInt(req.query.perPage, 10);
    const term = req.query.term as string | undefined;
    const caixaId = req.query.caixaId as string | undefined;
    const lojaId = this.getLojaFilter(req);

    const result = await this.service.listarOuBuscarMovimentacoes(
      page,
      perPage,
      lojaId,
      term,
      caixaId
    );
    return res.json(result);
  };
}
