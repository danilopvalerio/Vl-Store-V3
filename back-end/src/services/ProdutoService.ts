// src/services/ProdutoService.ts

import { AppDataSource } from "../database/data-source";
import { Brackets } from "typeorm";
import Produto from "../models/Produto";

/**
 * Interface para criação de um novo Produto.
 */
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

/**
 * Tipo para atualização de um Produto, permitindo campos opcionais.
 */
export type ProdutoUpdateDTO = Partial<ProdutoCreateDTO>;

/**
 * Serviço para operações CRUD no modelo Produto.
 */
export class ProdutoService {
  /**
   * Cria um novo produto no banco de dados.
   */
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

  /**
   * Retorna todos os produtos de uma loja específica.
   */
  async findAll(idLoja: string): Promise<Produto[]> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    return await produtoRepository.findBy({ idLoja });
  }

  /**
   * Encontra um produto pela sua referência.
   */
  async findById(referencia: string): Promise<Produto> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    const produto = await produtoRepository.findOneBy({ referencia });

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }
    return produto;
  }

  /**
   * Atualiza um produto existente.
   */
  async update(referencia: string, data: ProdutoUpdateDTO): Promise<Produto> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    const produto = await this.findById(referencia); // Reutiliza o findById

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

  /**
   * Exclui um produto do banco de dados.
   */
  async delete(referencia: string): Promise<void> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    const result = await produtoRepository.delete({ referencia });

    if (result.affected === 0) {
      throw new Error("Produto não encontrado.");
    }
  }

  /**
   * Retorna produtos de uma loja específica de forma paginada.
   * @param idLoja O ID da loja para filtrar os produtos.
   * @param page O número da página.
   * @param limit O número de produtos por página.
   */
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

  /**
   * Busca produtos de uma loja por um termo de pesquisa, de forma paginada.
   * A busca é case-insensitive e abrange os campos: referencia, nome, categoria,
   * material, genero do produto e a descrição de suas variações.
   * @param idLoja O ID da loja para filtrar os produtos.
   * @param term O termo a ser buscado.
   * @param page O número da página.
   * @param limit O número de produtos por página.
   */
  async search(
    idLoja: string,
    term: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Produto> & { totalPages: number }> {
    const produtoRepository = AppDataSource.getRepository(Produto);
    const skip = (page - 1) * limit;

    const queryBuilder = produtoRepository.createQueryBuilder("produto");

    // Realiza um LEFT JOIN com as variações para poder buscar na descrição delas
    // e também para incluí-las no resultado. O `getManyAndCount` lida com
    // a contagem correta da entidade principal (produto).
    queryBuilder
      .leftJoinAndSelect("produto.variacoes", "variacao")
      .where("produto.idLoja = :idLoja", { idLoja })
      .andWhere(
        // Agrupa todas as condições de busca com OR
        new Brackets((qb) => {
          const searchTerm = `%${term}%`;

          // Usamos `ILIKE` para busca case-insensitive (padrão do PostgreSQL)
          // Se estiver usando outro banco, pode ser necessário usar `LOWER(campo) LIKE LOWER(:term)`
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
