// src/services/ProdutoService.ts
import { AppDataSource } from "../database/data-source";
import { Brackets, SelectQueryBuilder, WhereExpressionBuilder } from "typeorm"; // WhereExpressionBuilder adicionado
import Produto from "../models/Produto";

export interface ProdutoCreateDTO {
  referencia: string;
  nome: string;
  categoria: string;
  material: string;
  genero: string;
  idLoja: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export type ProdutoUpdateDTO = Partial<ProdutoCreateDTO>;

export class ProdutoService {
  async create(data: ProdutoCreateDTO): Promise<Produto> {
    const produtoRepository = AppDataSource.getRepository(Produto);

    const produtoExistente = await produtoRepository.findOneBy({
      referencia: data.referencia,
    });

    if (produtoExistente) {
      throw new Error("Já existe um produto com essa referência.");
    }

    const produtoNovo = produtoRepository.create(data);
    await produtoRepository.save(produtoNovo);
    return produtoNovo;
  }

  async findAll(idLoja: string): Promise<Produto[]> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    return await produtoRepository.findBy({ idLoja });
  }

  async findById(referencia: string): Promise<Produto> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    const produto = await produtoRepository.findOneBy({ referencia });

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }
    return produto;
  }

  async update(referencia: string, data: ProdutoUpdateDTO): Promise<Produto> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    const produto = await this.findById(referencia);

    if (data.referencia && data.referencia !== referencia) {
      const produtoComMesmaReferencia = await produtoRepository.findOneBy({
        referencia: data.referencia,
      });
      if (produtoComMesmaReferencia) {
        throw new Error("Esta referência já está em uso por outro produto.");
      }
    }

    produtoRepository.merge(produto, data);
    return await produtoRepository.save(produto);
  }

  async delete(referencia: string): Promise<void> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    const result = await produtoRepository.delete({ referencia });

    if (result.affected === 0) {
      throw new Error("Produto não encontrado.");
    }
  }

  async findPaginated(
    idLoja: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Produto> & { totalPages: number }> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    const skip = (page - 1) * limit;

    const [produtos, total] = await produtoRepository.findAndCount({
      where: { idLoja },
      skip,
      take: limit,
      order: { nome: "ASC" },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: produtos,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async search(
    idLoja: string,
    term: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Produto> & { totalPages: number }> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    const skip = (page - 1) * limit;

    const queryBuilder: SelectQueryBuilder<Produto> =
      produtoRepository.createQueryBuilder("produto");

    queryBuilder
      .leftJoinAndSelect("produto.variacoes", "variacao")
      .where("produto.idLoja = :idLoja", { idLoja })
      .andWhere(
        new Brackets((qb: WhereExpressionBuilder) => {
          // TIPO CORRIGIDO
          const searchTerm = `%${term}%`;
          qb.where("produto.referencia ILIKE :term", { term: searchTerm })
            .orWhere("produto.nome ILIKE :term", { term: searchTerm })
            .orWhere("produto.categoria ILIKE :term", { term: searchTerm })
            .orWhere("produto.material ILIKE :term", { term: searchTerm })
            .orWhere("produto.genero ILIKE :term", { term: searchTerm })
            .orWhere("variacao.descricao ILIKE :term", { term: searchTerm });
        })
      );

    const [produtos, total] = await queryBuilder
      .orderBy("produto.nome", "ASC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: produtos,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
