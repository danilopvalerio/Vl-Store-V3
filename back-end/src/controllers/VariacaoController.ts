import { Request, Response } from "express";
import { VariacaoService } from "../services/VariacaoService";
import { ProdutoService } from "../services/ProdutoService";

export class VariacaoController {
  async create(request: Request, response: Response): Promise<Response> {
    const { referenciaProduto } = request.body;
    const idLoja = request.user.idLoja;

    const produtoService = new ProdutoService();
    const variacaoService = new VariacaoService();

    try {
      const produto = await produtoService.findById(referenciaProduto);
      if (produto.idLoja !== idLoja) {
        return response
          .status(403)
          .json({ message: "Este produto não pertence à sua loja." });
      }

      const novaVariacao = await variacaoService.create(request.body);
      return response.status(201).json(novaVariacao);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(400).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async findById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const variacaoService = new VariacaoService();

    try {
      const variacao = await variacaoService.findById(id);
      if (variacao.produto.idLoja !== request.user.idLoja) {
        return response
          .status(403)
          .json({ message: "Acesso negado a esta variação." });
      }
      return response.json(variacao);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async findAllByLoja(request: Request, response: Response): Promise<Response> {
    const variacaoService = new VariacaoService();
    const idLoja = request.user.idLoja;
    const variacoes = await variacaoService.findAllByLoja(idLoja);
    return response.json(variacoes);
  }

  async findAllByProduto(
    request: Request,
    response: Response
  ): Promise<Response> {
    const { referencia } = request.params;
    const variacaoService = new VariacaoService();
    const variacoes = await variacaoService.findAllByProduto(referencia);
    return response.json(variacoes);
  }

  async findPaginatedByProduto(
    request: Request,
    response: Response
  ): Promise<Response> {
    const { referencia } = request.params;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 15;
    const variacaoService = new VariacaoService();

    const result = await variacaoService.findPaginatedByProduto(
      referencia,
      page,
      limit
    );
    return response.status(200).json(result);
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const variacaoService = new VariacaoService();

    try {
      const variacaoExistente = await variacaoService.findById(id);
      if (variacaoExistente.produto.idLoja !== request.user.idLoja) {
        return response.status(403).json({
          message: "Você não tem permissão para editar esta variação.",
        });
      }

      const variacaoAtualizada = await variacaoService.update(id, request.body);
      return response.json(variacaoAtualizada);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(400).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const variacaoService = new VariacaoService();

    try {
      const variacaoExistente = await variacaoService.findById(id);
      if (variacaoExistente.produto.idLoja !== request.user.idLoja) {
        return response.status(403).json({
          message: "Você não tem permissão para deletar esta variação.",
        });
      }

      await variacaoService.delete(id);
      return response.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  /**
   * NOVO: Retorna todas as variações da loja de forma paginada.
   */
  async findPaginatedByLoja(
    request: Request,
    response: Response
  ): Promise<Response> {
    const idLoja = request.user.idLoja;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const variacaoService = new VariacaoService();

    try {
      const result = await variacaoService.findPaginatedByLoja(
        idLoja,
        page,
        limit
      );
      return response.status(200).json(result);
    } catch (error) {
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  /**
   * NOVO: Busca variações da loja por um termo, de forma paginada.
   */
  async searchByLoja(request: Request, response: Response): Promise<Response> {
    const idLoja = request.user.idLoja;
    const { term } = request.query;
    if (!term || typeof term !== "string") {
      return response
        .status(400)
        .json({ message: "O parâmetro de busca 'term' é obrigatório." });
    }

    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const variacaoService = new VariacaoService();

    try {
      const result = await variacaoService.searchByLoja(
        idLoja,
        term,
        page,
        limit
      );
      return response.status(200).json(result);
    } catch (error) {
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }
}
