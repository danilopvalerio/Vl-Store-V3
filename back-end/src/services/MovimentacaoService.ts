import { AppDataSource } from "../database/data-source";
import Movimentacao from "../models/Movimentacao";
import Caixa from "../models/Caixa";
import { VendaService } from "./VendaService";
import { PaginatedResult } from "./ProdutoService";
import { Brackets } from "typeorm";

export interface MovimentacaoCreateDTO {
  descricao: string;
  tipo: "SANGRIA" | "SUPRIMENTO" | "DESPESA";
  valor: number;
  idCaixa: string;
  idLoja: string;
}

export class MovimentacaoService {
  async create(data: MovimentacaoCreateDTO): Promise<Movimentacao> {
    const caixa = await AppDataSource.getRepository(Caixa).findOneBy({
      id_caixa: data.idCaixa,
      status: "ABERTO",
    });
    if (!caixa) {
      throw new Error("Movimentações só podem ser feitas em um caixa aberto.");
    }
    if (data.valor <= 0) {
      throw new Error("O valor da movimentação deve ser positivo.");
    }

    const repo = AppDataSource.getRepository(Movimentacao);
    const novaMovimentacao = repo.create(data);
    return await repo.save(novaMovimentacao);
  }

  async findById(id_movimentacao: string): Promise<Movimentacao> {
    const repo = AppDataSource.getRepository(Movimentacao);
    const movimentacao = await repo.findOne({
      where: { id_movimentacao },
      relations: ["caixa", "venda"],
    });
    if (!movimentacao) throw new Error("Movimentação não encontrada.");
    return movimentacao;
  }

  async findPaginatedByFilter(
    filter: { idLoja: string; idCaixa?: string },
    page: number,
    limit: number
  ): Promise<PaginatedResult<Movimentacao>> {
    const skip = (page - 1) * limit;
    const [data, total] = await AppDataSource.getRepository(
      Movimentacao
    ).findAndCount({
      where: filter,
      order: { dataCriacao: "DESC" },
      skip,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async searchPaginatedByFilter(
    filter: { idLoja: string; idCaixa?: string },
    term: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<Movimentacao>> {
    const skip = (page - 1) * limit;
    const qb = AppDataSource.getRepository(Movimentacao)
      .createQueryBuilder("movimentacao")
      .where(
        filter.idCaixa
          ? "movimentacao.idCaixa = :idCaixa"
          : "movimentacao.idLoja = :idLoja",
        filter
      );

    if (term) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where("movimentacao.descricao ILIKE :term", { term: `%${term}%` })
            .orWhere("movimentacao.tipo ILIKE :term", { term: `%${term}%` });
        })
      );
    }

    const [data, total] = await qb
      .orderBy("movimentacao.dataCriacao", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id_movimentacao: string, idLoja: string): Promise<void> {
    const repo = AppDataSource.getRepository(Movimentacao);
    const movimentacao = await repo.findOneBy({ id_movimentacao, idLoja });

    if (!movimentacao) {
      throw new Error(
        "Movimentação não encontrada ou não pertence à sua loja."
      );
    }

    // REGRA DE NEGÓCIO: Se a movimentação está atrelada a uma venda, cancele a venda em vez de deletar a movimentação.
    if (movimentacao.idVenda) {
      // Nota: A lógica do prompt era deletar a venda. Cancelar é uma prática muito melhor.
      const vendaService = new VendaService();
      await vendaService.cancel(movimentacao.idVenda, idLoja);
    } else {
      // Se for uma movimentação avulsa (sangria, suprimento, despesa), pode ser removida.
      await repo.remove(movimentacao);
    }
  }
}
