//src/controllers/caixa.controller.ts
import { Request, Response, NextFunction } from "express";
import { CaixaService, UserActor } from "../services/caixa.service";
import {
  CreateCaixaDTO,
  ToggleCaixaStatusDTO,
  UpdateCaixaUserDTO, // Agora está sendo usado
} from "../dtos/caixa.dto";
import { CreateMovimentacaoDTO } from "../dtos/movimentacao.dto";

export class CaixaController {
  private service: CaixaService;

  constructor() {
    this.service = new CaixaService();
  }

  // ============================================================
  // HELPERS
  // ============================================================
  private getActor(req: Request): UserActor {
    if (!req.user || !req.user.userId) {
      throw new Error(
        "Erro de Autenticação: Usuário não encontrado no request."
      );
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

  private toInt(val: unknown, def: number): number {
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? def : parsed;
  }

  // ============================================================
  // HANDLERS
  // ============================================================

  async getCurrentUserCaixa(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = this.getActor(req);
      // Passa lojaId para o service resolver o perfil
      const caixa = await this.service.buscarCaixaAtivoUsuario(
        actor.id,
        actor.lojaId
      );
      return res.json(caixa);
    } catch (error) {
      next(error);
    }
  }

  async openCaixa(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as CreateCaixaDTO;
      const actor = this.getActor(req);

      const result = await this.service.abrirCaixa(body, actor);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPaginated(req: Request, res: Response, next: NextFunction) {
    try {
      const page = this.toInt(req.query.page, 1);
      const perPage = this.toInt(req.query.perPage, 10);
      const term = req.query.term as string | undefined;
      const lojaId = this.getLojaFilter(req);

      const result = await this.service.listarOuBuscar(
        page,
        perPage,
        lojaId,
        term
      );
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async toggleCaixaStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const body = req.body as ToggleCaixaStatusDTO;

      const result = await this.service.alterarStatus(id, body);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // CORREÇÃO: Adicionado método para usar UpdateCaixaUserDTO
  async updateResponsible(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const body = req.body as UpdateCaixaUserDTO;

      const result = await this.service.trocarResponsavel(id, body);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCaixaById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.buscarPorId(id);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.getDashboardStats(id);

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // MOVIMENTAÇÕES
  // ============================================================

  async addMovimentacao(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = this.getActor(req);
      const body = req.body as CreateMovimentacaoDTO;
      const result = await this.service.adicionarMovimentacaoManual(
        body,
        actor
      );
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateMovimentacao(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.service.atualizarMovimentacao(id, req.body);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteMovimentacao(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.service.deletarMovimentacao(id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getMovimentacoesPaginated(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const page = this.toInt(req.query.page, 1);
      const perPage = this.toInt(req.query.perPage, 10);
      const term = req.query.term as string | undefined;

      // Filtros opcionais
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
    } catch (error) {
      next(error);
    }
  }
}
