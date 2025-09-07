import { Request, Response } from "express";
import { CaixaService } from "../services/CaixaService";

export class CaixaController {
  async open(request: Request, response: Response): Promise<Response> {
    try {
      const { valorAbertura, cpf } = request.body;
      const { idLoja } = request.user;
      const caixaService = new CaixaService();

      const novoCaixa = await caixaService.open({
        valorAbertura,
        idLoja,
        cpfFuncionarioResponsavel: cpf,
      });

      return response.status(201).json(novoCaixa);
    } catch (error: any) {
      return response.status(400).json({ message: error.message });
    }
  }

  async close(request: Request, response: Response): Promise<Response> {
    try {
      const { id_caixa } = request.params;
      const { valorFechamento } = request.body;
      const caixaService = new CaixaService();

      const resultado = await caixaService.close(id_caixa, { valorFechamento });
      return response.status(200).json(resultado);
    } catch (error: any) {
      return response.status(400).json({ message: error.message });
    }
  }

  async delete(request: Request, response: Response): Promise<Response> {
    try {
      const { id_caixa } = request.params;
      const caixaService = new CaixaService();

      await caixaService.delete(id_caixa);

      return response.status(204).send(); // Sem conteúdo
    } catch (error: any) {
      return response.status(400).json({ message: error.message });
    }
  }

  async findById(request: Request, response: Response): Promise<Response> {
    try {
      const { id_caixa } = request.params;
      const caixaService = new CaixaService();
      const caixa = await caixaService.findById(id_caixa);
      return response.json(caixa);
    } catch (error: any) {
      return response.status(404).json({ message: error.message });
    }
  }

  async findMyOpenCaixa(
    request: Request,
    response: Response
  ): Promise<Response> {
    try {
      const { cpf } = request.body;
      const { idLoja } = request.user;
      const caixaService = new CaixaService();
      const caixa = await caixaService.findOpenCaixaByFuncionario(cpf, idLoja);
      return response.json(caixa);
    } catch (error: any) {
      return response.status(500).json({ message: error.message });
    }
  }

  async findAllByLoja(request: Request, response: Response): Promise<Response> {
    try {
      const { idLoja } = request.user;
      const caixaService = new CaixaService();
      const caixas = await caixaService.findAllByLoja(idLoja);
      return response.json(caixas);
    } catch (error: any) {
      return response.status(500).json({ message: error.message });
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
      const caixaService = new CaixaService();
      const result = await caixaService.findPaginatedByLoja(
        idLoja,
        page,
        limit
      );
      return response.json(result);
    } catch (error: any) {
      return response.status(500).json({ message: error.message });
    }
  }

  async searchByLoja(request: Request, response: Response): Promise<Response> {
    try {
      const { idLoja } = request.user;
      const term = (request.query.term as string) || "";
      const page = parseInt(request.query.page as string) || 1;
      const limit = parseInt(request.query.limit as string) || 10;
      const caixaService = new CaixaService();
      const result = await caixaService.searchByLoja(idLoja, term, page, limit);
      return response.json(result);
    } catch (error: any) {
      return response.status(500).json({ message: error.message });
    }
  }
}
