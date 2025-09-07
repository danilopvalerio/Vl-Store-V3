import { AppDataSource } from "../database/data-source";
import { Brackets } from "typeorm";
import Venda from "../models/Venda";
import ItemVenda from "../models/ItemVenda";
import Movimentacao from "../models/Movimentacao";
import ProdutoVariacao from "../models/ProdutoVariacao";
import Caixa from "../models/Caixa";
import { PaginatedResult } from "./ProdutoService";
import Funcionario from "../models/Funcionario"; // <-- Importação necessária

interface ItemVendaDTO {
  idVariacao: string;
  quantidade: number;
}

// ATUALIZADO: A interface agora espera tanto 'idCaixa' quanto 'cpfFuncionarioResponsavel' vindos da requisição.
export interface VendaCreateDTO {
  formaPagamento: "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "PIX";
  idCaixa: string;
  cpfFuncionarioResponsavel: string;
  idLoja: string; // Será preenchido pelo controller a partir do token de autenticação
  desconto?: number;
  acrescimo?: number;
  itens: ItemVendaDTO[];
}

export class VendaService {
  private getTipoMovimentacao(formaPagamento: string): string {
    const map: { [key: string]: string } = {
      DINHEIRO: "ENTRADA_VENDA_DINHEIRO",
      CARTAO_CREDITO: "ENTRADA_VENDA_CARTAO_CREDITO",
      CARTAO_DEBITO: "ENTRADA_VENDA_CARTAO_DEBITO",
      PIX: "ENTRADA_VENDA_PIX",
    };
    const tipo = map[formaPagamento];
    if (!tipo) throw new Error("Forma de pagamento inválida");
    return tipo;
  }

  async create(data: VendaCreateDTO): Promise<Venda> {
    return AppDataSource.transaction(async (tm) => {
      // --- ETAPA 1: VALIDAÇÕES ---

      // NOVO: Valida se o vendedor (funcionário) informado existe e pertence à loja correta.
      const funcionario = await tm.findOneBy(Funcionario, {
        cpf: data.cpfFuncionarioResponsavel,
        idLoja: data.idLoja,
      });
      if (!funcionario) {
        throw new Error("Vendedor não encontrado ou não pertence a esta loja.");
      }

      // Valida se o caixa informado existe, pertence à loja e está aberto.
      const caixa = await tm.findOneBy(Caixa, {
        id_caixa: data.idCaixa,
        idLoja: data.idLoja,
        status: "ABERTO",
      });
      if (!caixa) {
        throw new Error(
          "Caixa não encontrado, não pertence à sua loja ou já está fechado."
        );
      }

      // --- ETAPA 2: PROCESSAMENTO E CRIAÇÃO DOS REGISTROS ---

      let valorTotal = 0;
      for (const item of data.itens) {
        const variacao = await tm.findOneBy(ProdutoVariacao, {
          id_variacao: item.idVariacao,
        });
        if (!variacao)
          throw new Error(`Variação ID ${item.idVariacao} não encontrada.`);
        if (variacao.quantidade < item.quantidade)
          throw new Error(
            `Estoque insuficiente para a variação ID ${item.idVariacao}.`
          );

        variacao.quantidade -= item.quantidade;
        await tm.save(variacao);
        valorTotal += Number(variacao.valor) * item.quantidade;
      }

      const novaVenda = tm.create(Venda, {
        ...data,
        idCaixa: caixa.id_caixa,
        data: new Date(),
        hora: new Date().toTimeString().split(" ")[0],
        statusVenda: "PENDENTE",
      });
      await tm.save(novaVenda);

      for (const item of data.itens) {
        const novoItem = tm.create(ItemVenda, {
          ...item,
          idVenda: novaVenda.id_venda,
        });
        await tm.save(novoItem);
      }

      const valorFinal =
        valorTotal - (data.desconto || 0) + (data.acrescimo || 0);
      const novaMovimentacao = tm.create(Movimentacao, {
        idCaixa: caixa.id_caixa,
        idLoja: data.idLoja,
        idVenda: novaVenda.id_venda,
        tipo: this.getTipoMovimentacao(data.formaPagamento),
        descricao: `Registro da Venda #${novaVenda.id_venda.substring(0, 8)}`,
        valor: valorFinal,
      });
      await tm.save(novaMovimentacao);

      return await tm.findOneOrFail(Venda, {
        where: { id_venda: novaVenda.id_venda },
        relations: ["itens", "itens.variacao", "funcionarioResponsavel"],
      });
    });
  }

  async findById(id_venda: string): Promise<Venda> {
    const venda = await AppDataSource.getRepository(Venda).findOne({
      where: { id_venda },
      relations: [
        "funcionarioResponsavel",
        "caixa",
        "loja",
        "itens",
        "itens.variacao",
        "itens.variacao.produto",
        "movimentacoes",
      ],
    });
    if (!venda) throw new Error("Venda não encontrada.");
    return venda;
  }

  async findPaginatedByFilter(
    filter: { idLoja: string; idCaixa?: string },
    page: number,
    limit: number
  ): Promise<PaginatedResult<Venda>> {
    const skip = (page - 1) * limit;
    const [data, total] = await AppDataSource.getRepository(Venda).findAndCount(
      {
        where: filter,
        relations: [
          "funcionarioResponsavel",
          "itens",
          "itens.variacao",
          "itens.variacao.produto",
        ],
        order: { data: "DESC", hora: "DESC" },
        skip,
        take: limit,
      }
    );
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async searchPaginatedByFilter(
    filter: { idLoja: string; idCaixa?: string },
    term: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<Venda>> {
    const skip = (page - 1) * limit;
    const qb = AppDataSource.getRepository(Venda)
      .createQueryBuilder("venda")
      .leftJoinAndSelect("venda.funcionarioResponsavel", "funcionario")
      .leftJoinAndSelect("venda.itens", "itemVenda")
      .leftJoinAndSelect("itemVenda.variacao", "variacao")
      .leftJoinAndSelect("variacao.produto", "produto")
      .where(
        filter.idCaixa ? "venda.idCaixa = :idCaixa" : "venda.idLoja = :idLoja",
        filter
      );

    if (term) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where("produto.nome ILIKE :term", { term: `%${term}%` })
            .orWhere("produto.referencia ILIKE :term", { term: `%${term}%` })
            .orWhere("funcionario.nome ILIKE :term", { term: `%${term}%` })
            .orWhere("venda.statusVenda ILIKE :term", { term: `%${term}%` })
            .orWhere("venda.formaPagamento ILIKE :term", { term: `%${term}%` });
        })
      );
    }

    const [data, total] = await qb
      .orderBy("venda.data", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async cancel(id_venda: string, idLoja: string): Promise<Venda> {
    return AppDataSource.transaction(async (transactionalEntityManager) => {
      const vendaRepository = transactionalEntityManager.getRepository(Venda);

      const venda = await vendaRepository.findOne({
        where: { id_venda, idLoja },
        relations: ["itens", "itens.variacao", "caixa"],
      });

      if (!venda) {
        throw new Error("Venda não encontrada ou não pertence à sua loja.");
      }
      if (venda.statusVenda === "CANCELADA") {
        throw new Error("Esta venda já foi cancelada.");
      }

      if (venda.caixa && venda.caixa.status === "FECHADO") {
        throw new Error(
          "Não é possível cancelar uma venda de um caixa que já foi fechado."
        );
      }

      for (const item of venda.itens) {
        if (item.variacao && item.quantidade && item.quantidade > 0) {
          const variacaoRepository =
            transactionalEntityManager.getRepository(ProdutoVariacao);
          await variacaoRepository.increment(
            { id_variacao: item.variacao.id_variacao },
            "quantidade",
            item.quantidade
          );
        }
      }

      const movimentacaoRepository =
        transactionalEntityManager.getRepository(Movimentacao);
      const movimentacao = await movimentacaoRepository.findOneBy({
        idVenda: id_venda,
      });

      if (movimentacao) {
        movimentacao.descricao = `[CANCELADA] ${movimentacao.descricao}`;
        movimentacao.valor = 0;
        await movimentacaoRepository.save(movimentacao);
      }

      venda.statusVenda = "CANCELADA";
      await vendaRepository.save(venda);

      return venda;
    });
  }
}
