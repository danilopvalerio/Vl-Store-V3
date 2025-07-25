// src/services/VariacaoService.ts

import { AppDataSource } from "../database/data-source";
import Variacao from "../models/ProdutoVariacao";
import Produto from "../models/Produto";

// Interface corrigida para usar 'referenciaProduto'
export interface ProdutoVariacaoCreateDTO {
  referenciaProduto: string;
  descricao: string;
  quantidade: number;
  valor: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type ProdutoVariacaoUpdateDTO = Partial<ProdutoVariacaoCreateDTO>;

export class VariacaoService {
  async create(data: ProdutoVariacaoCreateDTO): Promise<Variacao> {
    const variacaoRepository = AppDataSource.getRepository(Variacao);
    const produtoRepository = AppDataSource.getRepository(Produto);

    // Busca o produto pela referência correta
    const produto = await produtoRepository.findOneBy({
      referencia: data.referenciaProduto,
    });

    if (!produto) {
      throw new Error("Produto com a referência informada não foi encontrado.");
    }

    const { referenciaProduto, ...dadosVariacao } = data;
    const novaVariacao = variacaoRepository.create({
      ...dadosVariacao,
      produto: produto,
    });

    await variacaoRepository.save(novaVariacao);
    return novaVariacao;
  }

  async findById(id_variacao: string): Promise<Variacao> {
    const variacaoRepository = AppDataSource.getRepository(Variacao);
    // Carrega a variação junto com o produto para futuras verificações de segurança
    const variacao = await variacaoRepository.findOne({
      where: { id_variacao },
      relations: { produto: true },
    });

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }
    return variacao;
  }

  async update(
    id_variacao: string,
    data: ProdutoVariacaoUpdateDTO
  ): Promise<Variacao> {
    const variacaoRepository = AppDataSource.getRepository(Variacao);
    const variacao = await this.findById(id_variacao); // Reutiliza o findById

    if (
      data.referenciaProduto &&
      data.referenciaProduto !== variacao.produto.referencia
    ) {
      const produtoRepository = AppDataSource.getRepository(Produto);
      const novoProduto = await produtoRepository.findOneBy({
        referencia: data.referenciaProduto,
      });
      if (!novoProduto) {
        throw new Error("A nova referência de produto informada não existe.");
      }
      variacao.produto = novoProduto;
    }

    const { referenciaProduto, ...dadosParaAtualizar } = data;
    variacaoRepository.merge(variacao, dadosParaAtualizar);
    return await variacaoRepository.save(variacao);
  }

  async delete(id_variacao: string): Promise<void> {
    const variacaoRepository = AppDataSource.getRepository(Variacao);
    const result = await variacaoRepository.delete(id_variacao);
    if (result.affected === 0) {
      throw new Error("Variação não encontrada.");
    }
  }

  async findAllByProduto(referenciaProduto: string): Promise<Variacao[]> {
    const variacaoRepository = AppDataSource.getRepository(Variacao);
    return await variacaoRepository.find({
      where: { produto: { referencia: referenciaProduto } },
    });
  }

  async findAllByLoja(idLoja: string): Promise<Variacao[]> {
    const variacaoRepository = AppDataSource.getRepository(Variacao);
    return await variacaoRepository.find({
      where: { produto: { idLoja: idLoja } },
    });
  }

  async findPaginated(
    referenciaProduto: string,
    page: number = 1,
    limit: number = 15
  ): Promise<PaginatedResult<Variacao>> {
    const variacaoRepository = AppDataSource.getRepository(Variacao);
    const skip = (page - 1) * limit;

    const [variacoes, total] = await variacaoRepository.findAndCount({
      where: { produto: { referencia: referenciaProduto } },
      skip,
      take: limit,
      order: { descricao: "ASC" },
    });

    return { data: variacoes, total, page, limit };
  }
}
