import { AppDataSource } from "../database/data-source";
import { Brackets } from "typeorm";
import Caixa from "../models/Caixa";
import Movimentacao from "../models/Movimentacao";
import Funcionario from "../models/Funcionario";
import { PaginatedResult } from "./ProdutoService";

export interface CaixaOpenDTO {
  valorAbertura: number;
  cpfFuncionarioResponsavel: string;
  idLoja: string;
}

export interface CaixaCloseDTO {
  valorFechamento: number;
}

export class CaixaService {
  /**
   * Abre um novo caixa para um funcionário, criando uma movimentação inicial (suprimento).
   */
  async open(data: CaixaOpenDTO): Promise<Caixa> {
    const funcionarioRepository = AppDataSource.getRepository(Funcionario);

    const funcionario = await funcionarioRepository.findOneBy({
      cpf: data.cpfFuncionarioResponsavel,
    });
    if (!funcionario) {
      throw new Error("Funcionário responsável não encontrado.");
    }

    return AppDataSource.transaction(async (transactionalEntityManager) => {
      const caixaRepository = transactionalEntityManager.getRepository(Caixa);

      // Garantir que funcionário não tem caixa aberto
      const hasOpenCaixa = await caixaRepository.findOneBy({
        cpfFuncionarioResponsavel: data.cpfFuncionarioResponsavel,
        status: "ABERTO",
      });
      if (hasOpenCaixa) {
        throw new Error(
          "Este funcionário já possui um caixa aberto. É preciso fechá-lo antes de abrir um novo."
        );
      }

      const novoCaixa = caixaRepository.create({
        dataAbertura: new Date(),
        horaAbertura: new Date().toTimeString().split(" ")[0],
        status: "ABERTO",
        idLoja: data.idLoja,
        cpfFuncionarioResponsavel: data.cpfFuncionarioResponsavel,
        funcionarioResponsavel: funcionario,
        valorAbertura: data.valorAbertura,
        saldoAtual: data.valorAbertura,
      });
      await caixaRepository.save(novoCaixa);

      // Movimentação inicial (suprimento)
      const movimentacaoRepository =
        transactionalEntityManager.getRepository(Movimentacao);
      const movimentacaoInicial = movimentacaoRepository.create({
        idCaixa: novoCaixa.id_caixa,
        idLoja: data.idLoja,
        tipo: "SUPRIMENTO",
        descricao: "Valor inicial de abertura (fundo de troco)",
        valor: data.valorAbertura,
      });
      await movimentacaoRepository.save(movimentacaoInicial);

      return novoCaixa;
    });
  }

  /**
   * Fecha um caixa e retorna resumo das movimentações.
   */
  async close(id_caixa: string, data: CaixaCloseDTO): Promise<any> {
    const caixaRepository = AppDataSource.getRepository(Caixa);
    const caixa = await caixaRepository.findOne({
      where: { id_caixa },
      relations: ["movimentacoes"],
    });

    if (!caixa) throw new Error("Caixa não encontrado.");
    if (caixa.status === "FECHADO")
      throw new Error("Este caixa já está fechado.");

    let valorEsperado = 0;
    const resumoMovimentacoes = {
      suprimentos: 0,
      sangrias: 0,
      despesas: 0,
      vendasDinheiro: 0,
      vendasCartaoCredito: 0,
      vendasCartaoDebito: 0,
      vendasPix: 0,
    };

    caixa.movimentacoes.forEach((mov) => {
      const valor = Number(mov.valor);
      switch (mov.tipo) {
        case "SUPRIMENTO":
          valorEsperado += valor;
          resumoMovimentacoes.suprimentos += valor;
          break;
        case "SANGRIA":
        case "DESPESA":
          valorEsperado -= valor;
          if (mov.tipo === "SANGRIA") resumoMovimentacoes.sangrias += valor;
          else resumoMovimentacoes.despesas += valor;
          break;
        case "ENTRADA_VENDA_DINHEIRO":
          valorEsperado += valor;
          resumoMovimentacoes.vendasDinheiro += valor;
          break;
        case "ENTRADA_VENDA_CARTAO_CREDITO":
          resumoMovimentacoes.vendasCartaoCredito += valor;
          break;
        case "ENTRADA_VENDA_CARTAO_DEBITO":
          resumoMovimentacoes.vendasCartaoDebito += valor;
          break;
        case "ENTRADA_VENDA_PIX":
          resumoMovimentacoes.vendasPix += valor;
          break;
      }
    });

    const diferenca = data.valorFechamento - valorEsperado;

    caixa.status = "FECHADO";
    caixa.horaFechamento = new Date().toTimeString().split(" ")[0];
    caixa.valorFechamento = data.valorFechamento;
    caixa.saldoAtual = valorEsperado; // registra o saldo esperado no fechamento
    await caixaRepository.save(caixa);

    return {
      id_caixa: caixa.id_caixa,
      status: "FECHADO",
      valorEsperado: valorEsperado.toFixed(2),
      valorInformado: data.valorFechamento.toFixed(2),
      diferenca: diferenca.toFixed(2),
      mensagem:
        diferenca === 0
          ? "Caixa fechado sem divergências."
          : diferenca > 0
          ? `Sobra de R$ ${diferenca.toFixed(2)}.`
          : `Faltando R$ ${Math.abs(diferenca).toFixed(2)}.`,
      resumo: resumoMovimentacoes,
    };
  }

  async delete(id_caixa: string): Promise<void> {
    const caixaRepository = AppDataSource.getRepository(Caixa);

    const caixa = await caixaRepository.findOne({
      where: { id_caixa },
    });

    if (!caixa) throw new Error("Caixa não encontrado.");

    if (caixa.status === "ABERTO") {
      throw new Error(
        "Não é permitido excluir um caixa aberto. Feche-o primeiro."
      );
    }

    await caixaRepository.remove(caixa);
  }

  async findById(id_caixa: string): Promise<Caixa> {
    const caixaRepository = AppDataSource.getRepository(Caixa);
    const caixa = await caixaRepository.findOne({
      where: { id_caixa },
      relations: {
        funcionarioResponsavel: true,
        loja: true,
        vendas: true,
        movimentacoes: true,
      },
    });
    if (!caixa) throw new Error("Caixa não encontrado.");
    return caixa;
  }

  async findOpenCaixaByFuncionario(
    cpf: string,
    idLoja: string
  ): Promise<Caixa | null> {
    const caixaRepository = AppDataSource.getRepository(Caixa);
    return await caixaRepository.findOne({
      where: {
        cpfFuncionarioResponsavel: cpf,
        idLoja: idLoja,
        status: "ABERTO",
      },
      relations: ["funcionarioResponsavel"],
    });
  }

  async findAllByLoja(idLoja: string): Promise<Caixa[]> {
    const caixaRepository = AppDataSource.getRepository(Caixa);
    return await caixaRepository.find({
      where: { idLoja },
      relations: ["funcionarioResponsavel"],
      order: { dataAbertura: "DESC" },
    });
  }

  async findPaginatedByLoja(
    idLoja: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<Caixa>> {
    const caixaRepository = AppDataSource.getRepository(Caixa);
    const skip = (page - 1) * limit;
    const [data, total] = await caixaRepository.findAndCount({
      where: { idLoja },
      relations: ["funcionarioResponsavel"],
      order: { dataAbertura: "DESC", horaAbertura: "DESC" },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async searchByLoja(
    idLoja: string,
    term: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<Caixa>> {
    const caixaRepository = AppDataSource.getRepository(Caixa);
    const skip = (page - 1) * limit;
    const queryBuilder = caixaRepository
      .createQueryBuilder("caixa")
      .leftJoinAndSelect("caixa.funcionarioResponsavel", "funcionario")
      .where("caixa.idLoja = :idLoja", { idLoja });

    if (term) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("caixa.status ILIKE :term", { term: `%${term}%` })
            .orWhere("funcionario.nome ILIKE :term", { term: `%${term}%` })
            .orWhere("funcionario.cpf ILIKE :term", { term: `%${term}%` })
            .orWhere("CAST(caixa.dataAbertura AS TEXT) LIKE :term", {
              term: `%${term}%`,
            });
        })
      );
    }

    const [data, total] = await queryBuilder
      .orderBy("caixa.dataAbertura", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
