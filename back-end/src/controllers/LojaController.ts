import { Request, Response } from "express";
import { LojaService } from "../services/LojaService";

export class LojaController {
  async create(request: Request, response: Response): Promise<Response> {
    const dadosDaLoja = request.body;
    const lojaService = new LojaService();

    try {
      const novaLoja = await lojaService.create(dadosDaLoja);
      return response.status(201).json(novaLoja);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(400).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async findAll(request: Request, response: Response): Promise<Response> {
    const lojaService = new LojaService();
    const lojas = await lojaService.findAll();
    return response.json(lojas);
  }

  async findById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params; // Pega o ID que vem na URL (ex: /lojas/abc-123)
    const lojaService = new LojaService();

    try {
      const loja = await lojaService.findById(id);
      return response.json(loja);
    } catch (error) {
      // Se o serviço lançar o erro "Loja não encontrada", retorna 404
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params; // Pega o ID da URL
    const dadosParaAtualizar = request.body;
    const lojaService = new LojaService();

    try {
      const lojaAtualizada = await lojaService.update(id, dadosParaAtualizar);
      return response.json(lojaAtualizada);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message }); // 404 Not Found
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const lojaService = new LojaService();

    try {
      await lojaService.delete(id);
      return response
        .status(204)
        .json({ message: "Loja deletada com sucesso." }); // 204 No Content: sucesso, sem corpo de resposta
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }
}
