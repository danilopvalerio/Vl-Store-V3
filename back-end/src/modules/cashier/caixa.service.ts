import { prisma } from "../../shared/database/prisma";
import { CaixaRepository, MovimentacaoRepository } from "./caixa.repository";
import {
  CreateCaixaDTO,
  ToggleCaixaStatusDTO,
  UpdateCaixaUserDTO,
  CreateMovimentacaoDTO,
  UpdateMovimentacaoDTO,
  CaixaDashboardStats,
  CaixaEntity,
  MovimentacaoEntity,
} from "./caixa.dto";
import { AppError } from "../../app/middleware/error.middleware";
import { LogService } from "../logs/log.service";
// 1. IMPORTAÇÃO
import Decimal from "decimal.js";

export interface UserActor {
  id: string;
  role: string;
  lojaId?: string;
}

export class CaixaService {
  constructor(
    private repo: CaixaRepository,
    private movRepo: MovimentacaoRepository,
    private logService: LogService
  ) {}

  // ... (HELPERS, ABERTURA, GESTÃO DE STATUS e MOVIMENTAÇÕES mantêm a lógica,
  // pois não fazem contas complexas, apenas CRUD simples) ...

  // Vou omitir os métodos que não mudaram para focar no cálculo matemático.
  // Pode manter os métodos abrirCaixa, alterarStatus, etc. idênticos ao anterior.

  private async resolveUserProfile(userId: string, lojaId: string) {
    const perfil = await prisma.user_profile.findFirst({
      where: { user_id: userId, id_loja: lojaId },
    });
    if (!perfil) {
      throw new AppError("Perfil de usuário não encontrado nesta loja.", 403);
    }
    return perfil;
  }

  async abrirCaixa(
    data: CreateCaixaDTO,
    actor: UserActor
  ): Promise<CaixaEntity> {
    const perfilAtor = await this.resolveUserProfile(actor.id, data.id_loja);
    let idProfileAlvo = perfilAtor.id_user_profile;

    if (
      data.id_user_profile &&
      data.id_user_profile !== perfilAtor.id_user_profile
    ) {
      const rolesGerencia = ["SUPER_ADMIN", "ADMIN", "GERENTE"];
      if (!rolesGerencia.includes(perfilAtor.cargo || "")) {
        throw new AppError(
          "Apenas Gerentes podem abrir caixa para outros operadores.",
          403
        );
      }
      idProfileAlvo = data.id_user_profile;
    }

    const caixaAtivo = await this.repo.findActiveByProfile(idProfileAlvo);
    if (caixaAtivo) {
      throw new AppError("Este usuário já possui um caixa aberto.", 409);
    }

    const novoCaixa = await this.repo.create({
      id_loja: data.id_loja,
      saldo_inicial: data.saldo_inicial,
      id_user_profile: idProfileAlvo,
      status: "ABERTO",
      data_abertura: new Date(),
    });

    await this.logService.logSystem({
      id_user: actor.id,
      acao: "Abrir Caixa",
      detalhes: `Caixa ID ${novoCaixa.id_caixa} aberto com R$ ${data.saldo_inicial}.`,
    });

    return novoCaixa;
  }

  async buscarCaixaAtivoUsuario(userId: string, lojaId?: string) {
    if (!lojaId) return null;
    const perfil = await this.resolveUserProfile(userId, lojaId);
    return this.repo.findActiveByProfile(perfil.id_user_profile);
  }

  async alterarStatus(
    idCaixa: string,
    data: ToggleCaixaStatusDTO,
    actorUserId: string
  ) {
    const caixa = await this.repo.findById(idCaixa);
    if (!caixa) throw new AppError("Caixa não encontrado.", 404);

    const updateData: { status?: string; saldo_final?: number } = {};
    let acaoLog = "";

    if (["ABERTO", "REABERTO"].includes(caixa.status)) {
      if (data.saldo_final === undefined || data.saldo_final < 0) {
        throw new AppError("Saldo final é obrigatório para fechar o caixa.");
      }
      updateData.status = "FECHADO";
      updateData.saldo_final = data.saldo_final;
      acaoLog = "Fechar Caixa";
    } else if (caixa.status === "FECHADO") {
      updateData.status = "REABERTO";
      updateData.saldo_final = 0;
      acaoLog = "Reabrir Caixa";
    } else {
      throw new AppError(`Status inválido para alteração: ${caixa.status}`);
    }

    const updated = await this.repo.update(idCaixa, updateData);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: acaoLog,
      detalhes: `Caixa ${idCaixa} alterado para ${updated.status}.`,
    });

    return updated;
  }

  async trocarResponsavel(idCaixa: string, data: UpdateCaixaUserDTO) {
    const caixa = await this.repo.findById(idCaixa);
    if (!caixa) throw new AppError("Caixa não encontrado.", 404);
    if (caixa.status === "FECHADO")
      throw new AppError("Não pode trocar responsável de caixa fechado.", 400);

    const updated = await this.repo.update(idCaixa, {
      id_user_profile: data.id_user_profile,
    });

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Trocar Responsável Caixa",
      detalhes: `Caixa ${idCaixa} transferido para perfil ${data.id_user_profile}.`,
    });

    return updated;
  }

  async buscarPorId(id: string) {
    const caixa = await this.repo.findById(id);
    if (!caixa) throw new AppError("Caixa não encontrado.", 404);
    return caixa;
  }

  async listarOuBuscar(
    page: number,
    perPage: number,
    lojaId?: string,
    term?: string
  ) {
    if (term) {
      const { data, total } = await this.repo.searchPaginated(
        term,
        page,
        perPage,
        lojaId
      );
      return { data, total, page, lastPage: Math.ceil(total / perPage) };
    }
    const { data, total } = await this.repo.findPaginated(
      page,
      perPage,
      lojaId
    );
    return { data, total, page, lastPage: Math.ceil(total / perPage) };
  }

  async adicionarMovimentacaoManual(
    data: CreateMovimentacaoDTO,
    actor: UserActor
  ): Promise<MovimentacaoEntity> {
    // ... validações iguais ao anterior ...
    if (data.tipo === "ENTRADA" && !actor.role.includes("ADMIN")) {
      // Regra opcional
    }

    let idCaixaAlvo = data.id_caixa;
    if (!idCaixaAlvo) {
      if (!actor.lojaId) throw new AppError("Loja não identificada.", 400);
      const caixaAtivo = await this.buscarCaixaAtivoUsuario(
        actor.id,
        actor.lojaId
      );
      if (!caixaAtivo)
        throw new AppError("Nenhum caixa aberto para este usuário.", 404);
      idCaixaAlvo = caixaAtivo.id_caixa;
    }

    const caixa = await this.repo.findById(idCaixaAlvo!);
    if (!caixa) throw new AppError("Caixa não encontrado.", 404);

    if (
      actor.lojaId &&
      caixa.id_loja !== actor.lojaId &&
      actor.role !== "SUPER_ADMIN"
    ) {
      throw new AppError(
        "Sem permissão para movimentar caixa de outra loja.",
        403
      );
    }

    if (caixa.status !== "ABERTO" && caixa.status !== "REABERTO") {
      throw new AppError(
        `Caixa fechado ou bloqueado. Status: ${caixa.status}`,
        409
      );
    }

    const mov = await this.movRepo.create({
      id_loja: caixa.id_loja,
      id_caixa: caixa.id_caixa,
      tipo: data.tipo,
      valor: data.valor,
      descricao: data.descricao,
      id_venda: null,
    });
    return mov;
  }

  async atualizarMovimentacao(
    idMov: string,
    data: UpdateMovimentacaoDTO,
    actorUserId: string
  ) {
    const mov = await this.movRepo.findById(idMov);
    if (!mov) throw new AppError("Movimentação não encontrada.", 404);

    const caixa = await this.repo.findById(mov.id_caixa);
    if (caixa && caixa.status === "FECHADO")
      throw new AppError(
        "Não é possível editar movimentações de um caixa já fechado.",
        403
      );

    const updated = await this.movRepo.update(idMov, {
      valor: data.valor,
      descricao: data.descricao,
      tipo: data.tipo,
    });

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Atualizar Movimentação",
      detalhes: `Movimentação ${idMov} (Caixa ${caixa?.id_caixa}) atualizada.`,
    });
    return updated;
  }

  async deletarMovimentacao(idMov: string, actorUserId: string) {
    const mov = await this.movRepo.findById(idMov);
    if (!mov) throw new AppError("Movimentação não encontrada.", 404);

    const caixa = await this.repo.findById(mov.id_caixa);
    if (caixa && caixa.status === "FECHADO")
      throw new AppError(
        "Não é possível excluir movimentações de um caixa já fechado.",
        403
      );

    await this.movRepo.delete(idMov);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Movimentação",
      detalhes: `Movimentação ${idMov} excluída do caixa ${caixa?.id_caixa}.`,
    });
  }

  async listarOuBuscarMovimentacoes(
    page: number,
    perPage: number,
    lojaId?: string,
    term?: string,
    caixaId?: string
  ) {
    if (term) {
      const { data, total } = await this.movRepo.searchPaginated(
        term,
        page,
        perPage,
        lojaId,
        caixaId
      );
      return { data, total, page, lastPage: Math.ceil(total / perPage) };
    }
    const { data, total } = await this.movRepo.findPaginated(
      page,
      perPage,
      lojaId,
      caixaId
    );
    return { data, total, page, lastPage: Math.ceil(total / perPage) };
  }

  // ==========================================================
  // DASHBOARD (CÁLCULOS CRÍTICOS COM DECIMAL.JS)
  // ==========================================================

  async getDashboardStats(id_caixa: string): Promise<CaixaDashboardStats> {
    const caixa = await this.repo.findById(id_caixa);
    if (!caixa) throw new AppError("Caixa não encontrado.", 404);

    const stats = await this.repo.getRawStats(id_caixa);

    // Variáveis que serão alteradas no loop (let)
    let decTotalEntradasGerais = new Decimal(0);
    let decSaida = new Decimal(0);
    let decSangria = new Decimal(0);
    let decSuprimento = new Decimal(0);

    // Variável que não muda (const)
    const decVenda = new Decimal(stats.totalVendas);

    stats.porTipo.forEach((stat) => {
      const valor = new Decimal(stat._sum.valor || 0);
      const tipo = stat.tipo;

      if (tipo === "ENTRADA") {
        decTotalEntradasGerais = valor;
      } else if (tipo === "SAIDA") {
        decSaida = valor;
      } else if (tipo === "SANGRIA") {
        decSangria = valor;
      } else if (tipo === "SUPRIMENTO") {
        decSuprimento = valor;
      }
    });

    // Cálculos finais (todos const, pois o resultado não muda mais)
    const decEntradaAvulsa = decTotalEntradasGerais.minus(decVenda);
    const decTotalEntradas = decTotalEntradasGerais.plus(decSuprimento);
    const decTotalSaidas = decSaida.plus(decSangria);

    const decSaldoInicial = new Decimal(caixa.saldo_inicial || 0);
    const decSaldoAtual = decSaldoInicial
      .plus(decTotalEntradas)
      .minus(decTotalSaidas);

    return {
      caixa,
      estatisticas: {
        saldo_atual: decSaldoAtual.toNumber(),
        total_entradas: decTotalEntradas.toNumber(),
        total_saidas: decTotalSaidas.toNumber(),
        detalhado: {
          VENDA: decVenda.toNumber(),
          ENTRADA_AVULSA: decEntradaAvulsa.toNumber(),
          SAIDA: decSaida.toNumber(),
          SANGRIA: decSangria.toNumber(),
          SUPRIMENTO: decSuprimento.toNumber(),
        },
      },
    };
  }
}
