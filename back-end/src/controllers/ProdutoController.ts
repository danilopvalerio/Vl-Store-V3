// src/controllers/ProdutoController.ts

import { Request, Response } from "express";
import { ProdutoService, PaginatedResult } from "../services/ProdutoService";

/**
 * Controlador para lidar com as operações HTTP relacionadas a Produtos.
 */
export class ProdutoController {
  /**
   * Cria um novo produto.
   */
  async create(request: Request, response: Response): Promise<Response> {
    // O idLoja é pego do usuário autenticado, não do corpo da requisição.
    const idLoja = request.user?.idLoja;
    if (!idLoja) {
      return response
        .status(401)
        .json({ message: "ID da loja não encontrado no token de acesso." });
    }

    const dadosDoProduto = { ...request.body, idLoja };
    const produtoService = new ProdutoService();

    try {
      const novoProduto = await produtoService.create(dadosDoProduto);
      return response.status(201).json(novoProduto);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(400).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  /**
   * Retorna todos os produtos da loja do usuário autenticado.
   */
  async findAll(request: Request, response: Response): Promise<Response> {
    const idLoja = request.user?.idLoja;
    if (!idLoja) {
      return response
        .status(401)
        .json({ message: "ID da loja não encontrado no token de acesso." });
    }

    const produtoService = new ProdutoService();
    const produtos = await produtoService.findAll(idLoja);
    return response.json(produtos);
  }

  /**
   * Encontra um produto pela sua referência.
   */
  async findById(request: Request, response: Response): Promise<Response> {
    const { referencia } = request.params;
    const produtoService = new ProdutoService();

    try {
      const produto = await produtoService.findById(referencia);
      return response.json(produto);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  /**
   * Atualiza um produto existente.
   */
  async update(request: Request, response: Response): Promise<Response> {
    const { referencia } = request.params;
    const dadosParaAtualizar = request.body;
    const produtoService = new ProdutoService();

    try {
      const produtoAtualizado = await produtoService.update(
        referencia,
        dadosParaAtualizar
      );
      return response.json(produtoAtualizado);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("encontrado")) {
          return response.status(404).json({ message: error.message });
        }
        return response.status(400).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  /**
   * Exclui um produto.
   */
  async delete(request: Request, response: Response): Promise<Response> {
    const { referencia } = request.params;
    const produtoService = new ProdutoService();

    try {
      await produtoService.delete(referencia);
      return response.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  /**
   * Retorna produtos da loja de forma paginada.
   */
  async findPaginated(request: Request, response: Response): Promise<Response> {
    const idLoja = request.user?.idLoja;
    if (!idLoja) {
      return response
        .status(401)
        .json({ message: "ID da loja não encontrado no token de acesso." });
    }

    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const produtoService = new ProdutoService();

    try {
      const result = await produtoService.findPaginated(idLoja, page, limit);
      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return response
          .status(500)
          .json({ message: `Erro ao buscar produtos: ${error.message}` });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  /**
   * Busca produtos por um termo de pesquisa, de forma paginada.
   * A busca é realizada em vários campos do produto e suas variações.
   * A rota para este método seria algo como: GET /produtos/search?term=valor&page=1
   */
  async search(request: Request, response: Response): Promise<Response> {
    const idLoja = request.user?.idLoja;
    if (!idLoja) {
      return response
        .status(401)
        .json({ message: "ID da loja não encontrado no token de acesso." });
    }

    const { term } = request.query;
    if (!term || typeof term !== "string") {
      return response
        .status(400)
        .json({ message: "O parâmetro de busca 'term' é obrigatório." });
    }

    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const produtoService = new ProdutoService();

    try {
      const result = await produtoService.search(idLoja, term, page, limit);
      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return response
          .status(500)
          .json({ message: `Erro ao buscar produtos: ${error.message}` });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }
}
