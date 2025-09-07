import { Request, Response } from "express";
import { MovimentacaoService } from "../services/MovimentacaoService";

export class MovimentacaoController {
  async create(request: Request, response: Response): Promise<Response> {
    try {
      const { idLoja } = request.user;
      const movimentacaoService = new MovimentacaoService();
      const novaMovimentacao = await movimentacaoService.create({
        ...request.body,
        idLoja,
      });
      return response.status(201).json(novaMovimentacao);
    } catch (error: any) {
      return response.status(400).json({ message: error.message });
    }
  }

  async findPaginatedByLoja(
    request: Request,
    response: Response
  ): Promise<Response> {
    try {
      const { idLoja } = request.user;
      const page = parseInt(request.query.page as string) || 1;
      const limit = parseInt(request.query.limit as string) || 10;
      const service = new MovimentacaoService();
      const result = await service.findPaginatedByFilter(
        { idLoja },
        page,
        limit
      );
      return response.json(result);
    } catch (error: any) {
      return response.status(500).json({ message: error.message });
    }
  }

  async searchPaginatedByLoja(
    request: Request,
    response: Response
  ): Promise<Response> {
    try {
      const { idLoja } = request.user;
      const term = (request.query.term as string) || "";
      const page = parseInt(request.query.page as string) || 1;
      const limit = parseInt(request.query.limit as string) || 10;
      const service = new MovimentacaoService();
      const result = await service.searchPaginatedByFilter(
        { idLoja },
        term,
        page,
        limit
      );
      return response.json(result);
    } catch (error: any) {
      return response.status(500).json({ message: error.message });
    }
  }

  async delete(request: Request, response: Response): Promise<Response> {
    try {
      const { id_movimentacao } = request.params;
      const { idLoja } = request.user;
      const service = new MovimentacaoService();
      await service.delete(id_movimentacao, idLoja);
      return response.status(204).send();
    } catch (error: any) {
      return response.status(400).json({ message: error.message });
    }
  }
}
