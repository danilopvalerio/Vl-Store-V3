//src/services/caixa.service.ts
import { prisma } from "../database/prisma"; // Necessário para buscar o perfil
import { Prisma } from "../generated/prisma/client";
import { CaixaRepository } from "../repositories/caixa.repository";
import { MovimentacaoRepository } from "../repositories/movimentacao.repository";
import {
  CreateCaixaDTO,
  ToggleCaixaStatusDTO,
  UpdateCaixaUserDTO,
} from "../dtos/caixa.dto";
import {
  CreateMovimentacaoDTO,
  UpdateMovimentacaoDTO,
} from "../dtos/movimentacao.dto";
import { AppError } from "../middlewares/error.middleware";

export interface UserActor {
  id: string; // ID do Usuário (Auth)
  role: string;
  lojaId?: string;
}

export class CaixaService {
  private repo: CaixaRepository;
  private movRepo: MovimentacaoRepository;

  constructor() {
    this.repo = new CaixaRepository();
    this.movRepo = new MovimentacaoRepository();
  }

  // ==========================================================
  // LÓGICA DE ABERTURA (Resolução de Perfil)
  // ==========================================================
  async abrirCaixa(dados: CreateCaixaDTO, actor: UserActor) {
    let idProfileAlvo = "";

    // 1. Descobrir o UserProfile do Ator Logado
    // O token tem userId, precisamos do user_profile_id desta loja
    const perfilAtor = await prisma.user_profile.findFirst({
      where: { user_id: actor.id, id_loja: dados.id_loja },
    });

    if (!perfilAtor) {
      throw new AppError("Perfil de usuário não encontrado nesta loja.", 403);
    }

    idProfileAlvo = perfilAtor.id_user_profile;

    // 2. Verifica se está tentando abrir para OUTRA pessoa (Gerente)
    if (
      dados.id_user_profile &&
      dados.id_user_profile !== perfilAtor.id_user_profile
    ) {
      const rolesGerencia = ["SUPER_ADMIN", "ADMIN", "GERENTE"];

      // Verifica permissão no perfil
      if (!rolesGerencia.includes(perfilAtor.cargo || "")) {
        throw new AppError(
          "Apenas Gerentes podem abrir caixa para outros operadores.",
          403
        );
      }
      idProfileAlvo = dados.id_user_profile;
    }

    // 3. Validações básicas
    if (dados.saldo_inicial < 0) {
      throw new AppError("O saldo inicial não pode ser negativo.");
    }

    // 4. Verifica se o PERFIL alvo JÁ tem caixa aberto
    const caixaAtivo = await this.repo.findActiveByProfile(idProfileAlvo);
    if (caixaAtivo) {
      throw new AppError("Este usuário já possui um caixa aberto.", 409);
    }

    // 5. Criação
    return this.repo.create({
      id_loja: dados.id_loja,
      id_user_profile: idProfileAlvo, // <--- Salvamos o ID do perfil
      saldo_inicial: dados.saldo_inicial,
      status: "ABERTO",
      data_abertura: new Date(),
    });
  }

  async buscarCaixaAtivoUsuario(userId: string, lojaId?: string) {
    // Precisamos achar o perfil primeiro
    if (!lojaId) return null; // Se não souber a loja, não tem como achar o perfil específico

    const perfil = await prisma.user_profile.findFirst({
      where: { user_id: userId, id_loja: lojaId },
    });

    if (!perfil) return null;

    return this.repo.findActiveByProfile(perfil.id_user_profile);
  }

  // ==========================================================
  // ALTERAÇÃO DE STATUS
  // ==========================================================
  async alterarStatus(idCaixa: string, dados: ToggleCaixaStatusDTO) {
    const caixa = await this.repo.findById(idCaixa);
    if (!caixa) throw new AppError("Caixa não encontrado.", 404);

    const updateData: Prisma.caixaUncheckedUpdateInput = {};

    if (["ABERTO", "REABERTO"].includes(caixa.status || "")) {
      // FECHAMENTO
      if (dados.saldo_final === undefined || dados.saldo_final < 0) {
        throw new AppError("Saldo final é obrigatório para fechar o caixa.");
      }
      updateData.status = "FECHADO";
      updateData.saldo_final = dados.saldo_final;
      updateData.data_fechamento = new Date();
    } else if (caixa.status === "FECHADO") {
      // REABERTURA
      updateData.status = "REABERTO";
      updateData.saldo_final = null;
      updateData.data_fechamento = null;
    } else {
      throw new AppError(
        `Não é possível alterar status de caixa: ${caixa.status}`
      );
    }

    return this.repo.update(idCaixa, updateData);
  }

  // CORREÇÃO: Implementação do método que usa o UpdateCaixaUserDTO
  async trocarResponsavel(idCaixa: string, dados: UpdateCaixaUserDTO) {
    const caixa = await this.repo.findById(idCaixa);
    if (!caixa) throw new AppError("Caixa não encontrado.", 404);

    if (caixa.status === "FECHADO") {
      throw new AppError("Não pode trocar responsável de caixa fechado.", 400);
    }

    return this.repo.update(idCaixa, {
      id_user_profile: dados.id_user_profile,
    });
  }

  // ==========================================================
  // BUSCAS E RELATÓRIOS
  // ==========================================================
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
      return this.repo.searchPaginated(term, page, perPage, lojaId);
    }
    return this.repo.findAllPaginated(page, perPage, lojaId);
  }

  // ==========================================================
  // MOVIMENTAÇÕES MANUAIS
  // ==========================================================
  async adicionarMovimentacaoManual(
    dados: CreateMovimentacaoDTO,
    actor: UserActor
  ) {
    if (dados.tipo === "ENTRADA") {
      throw new AppError(
        "Entradas de venda devem ser feitas através do módulo de Vendas.",
        400
      );
    }

    let idCaixaAlvo = dados.id_caixa;
    if (!idCaixaAlvo) {
      // Busca caixa ativo (precisa passar lojaId para resolver perfil)
      const caixaAtivo = await this.buscarCaixaAtivoUsuario(
        actor.id,
        actor.lojaId
      );
      if (!caixaAtivo)
        throw new AppError("Nenhum caixa aberto para este usuário.", 404);
      idCaixaAlvo = caixaAtivo.id_caixa;
    }

    const caixa = await this.repo.findById(idCaixaAlvo);
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

    return this.movRepo.create({
      id_loja: caixa.id_loja,
      id_caixa: caixa.id_caixa,
      tipo: dados.tipo,
      valor: dados.valor,
      descricao: dados.descricao,
      id_venda: null,
    });
  }

  async atualizarMovimentacao(idMov: string, dados: UpdateMovimentacaoDTO) {
    const mov = await this.movRepo.findById(idMov);
    if (!mov) throw new AppError("Movimentação não encontrada.", 404);

    const caixa = await this.repo.findById(mov.id_caixa);
    if (caixa && caixa.status === "FECHADO") {
      throw new AppError(
        "Não é possível editar movimentações de um caixa já fechado.",
        403
      );
    }
    if (dados.valor !== undefined && dados.valor <= 0) {
      throw new AppError("O valor deve ser positivo.", 400);
    }

    return this.movRepo.update(idMov, {
      valor: dados.valor,
      descricao: dados.descricao,
      tipo: dados.tipo,
    });
  }

  async deletarMovimentacao(idMov: string) {
    const mov = await this.movRepo.findById(idMov);
    if (!mov) throw new AppError("Movimentação não encontrada.", 404);

    const caixa = await this.repo.findById(mov.id_caixa);
    if (caixa && caixa.status === "FECHADO") {
      throw new AppError(
        "Não é possível excluir movimentações de um caixa já fechado.",
        403
      );
    }

    await this.movRepo.delete(idMov);
  }

  async listarOuBuscarMovimentacoes(
    page: number,
    perPage: number,
    lojaId?: string,
    term?: string,
    caixaId?: string // Opcional: Se quiser filtrar só de um caixa
  ) {
    if (term) {
      return this.movRepo.searchPaginated(term, page, perPage, lojaId, caixaId);
    }
    return this.movRepo.findAllPaginated(page, perPage, lojaId, caixaId);
  }

  async getDashboardStats(id_caixa: string) {
    // 1. Busca dados do caixa
    const caixa = await this.repo.findById(id_caixa);
    if (!caixa) throw new AppError("Caixa não encontrado.", 404);

    // 2. Busca estatísticas (Agora retorna objeto complexo)
    const { porTipo, totalVendas } = await this.repo.getStatsById(id_caixa);

    // 3. Inicializa zerado
    const resumo = {
      VENDA: 0, // Novo campo calculado
      ENTRADA_AVULSA: 0, // Novo campo calculado
      SAIDA: 0,
      SANGRIA: 0,
      SUPRIMENTO: 0,
    };

    // 4. Preenche os dados básicos do ENUM
    let totalEntradasGerais = 0;

    porTipo.forEach((stat) => {
      const valor = Number(stat._sum.valor || 0);
      const tipo = stat.tipo as string;

      if (tipo === "ENTRADA") {
        totalEntradasGerais = valor;
      } else if (
        tipo === "SAIDA" ||
        tipo === "SANGRIA" ||
        tipo === "SUPRIMENTO"
      ) {
        resumo[tipo as keyof typeof resumo] = valor;
      }
    });

    // 5. Separa o que é VENDA do que é ENTRADA AVULSA
    resumo.VENDA = totalVendas;
    resumo.ENTRADA_AVULSA = totalEntradasGerais - totalVendas;

    // 6. Cálculos Finais de Saldo
    // (Vendas + Entradas Avulsas + Suprimentos)
    const totalEntradas = totalEntradasGerais + resumo.SUPRIMENTO;
    const totalSaidas = resumo.SAIDA + resumo.SANGRIA;

    const saldoAtual =
      Number(caixa.saldo_inicial) + totalEntradas - totalSaidas;

    return {
      caixa,
      estatisticas: {
        saldo_atual: saldoAtual,
        total_entradas: totalEntradas,
        total_saidas: totalSaidas,
        detalhado: resumo,
      },
    };
  }
}
