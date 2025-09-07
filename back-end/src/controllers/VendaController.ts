import { Request, Response } from "express";
import { VendaService } from "../services/VendaService";

export class VendaController {
  async create(request: Request, response: Response): Promise<Response> {
    try {
      // O idLoja vem do usuário autenticado (token) para segurança.
      const { idLoja } = request.user;

      // Os outros dados, incluindo idCaixa e cpfFuncionarioResponsavel, vêm do corpo da requisição.
      const dadosDaVenda = request.body;

      const vendaService = new VendaService();

      // Combina os dados do corpo da requisição com o idLoja do usuário autenticado.
      const novaVenda = await vendaService.create({
        ...dadosDaVenda,
        idLoja,
      });

      return response.status(201).json(novaVenda);
    } catch (error: any) {
      return response.status(400).json({ message: error.message });
    }
  }

  async findById(request: Request, response: Response): Promise<Response> {
    try {
      const { id_venda } = request.params;
      const vendaService = new VendaService();
      const venda = await vendaService.findById(id_venda);
      if (venda.idLoja !== request.user.idLoja) {
        return response.status(403).json({ message: "Acesso negado." });
      }
      return response.json(venda);
    } catch (error: any) {
      return response.status(404).json({ message: error.message });
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
      const vendaService = new VendaService();
      const result = await vendaService.findPaginatedByFilter(
        { idLoja },
        page,
        limit
      );
      return response.json(result);
    } catch (error: any) {
      return response.status(500).json({ message: error.message });
    }
  }

  async findPaginatedByCaixa(
    request: Request,
    response: Response
  ): Promise<Response> {
    try {
      const { idLoja } = request.user;
      const { idCaixa } = request.params;
      const page = parseInt(request.query.page as string) || 1;
      const limit = parseInt(request.query.limit as string) || 10;
      const vendaService = new VendaService();
      const result = await vendaService.findPaginatedByFilter(
        { idLoja, idCaixa },
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
      const vendaService = new VendaService();
      const result = await vendaService.searchPaginatedByFilter(
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

  async cancel(request: Request, response: Response): Promise<Response> {
    try {
      const { id_venda } = request.params;
      const { idLoja } = request.user;
      const vendaService = new VendaService();
      const vendaCancelada = await vendaService.cancel(id_venda, idLoja);
      return response.json(vendaCancelada);
    } catch (error: any) {
      return response.status(400).json({ message: error.message });
    }
  }
}
