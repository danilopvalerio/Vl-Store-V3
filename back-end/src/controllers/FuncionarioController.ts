import { Request, Response } from "express";
import { FuncionarioService } from "../services/FuncionarioService";

export class FuncionarioController {
  async create(request: Request, response: Response): Promise<Response> {
    const dadosDoFuncionario = request.body;
    const { idLoja } = request.user;

    const funcionarioService = new FuncionarioService();

    try {
      const novoFuncionario = await funcionarioService.create(
        idLoja,
        dadosDoFuncionario
      );
      return response.status(201).json(novoFuncionario);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(400).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async findAll(request: Request, response: Response): Promise<Response> {
    const { idLoja } = request.user;
    const funcionarioService = new FuncionarioService();

    try {
      const funcionarios = await funcionarioService.findAll(idLoja);
      return response.json(funcionarios);
    } catch (error) {
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async findByCpf(request: Request, response: Response): Promise<Response> {
    const { cpf } = request.params;
    const { idLoja } = request.user;
    const funcionarioService = new FuncionarioService();

    try {
      const funcionario = await funcionarioService.findByCpf(idLoja, cpf);
      return response.json(funcionario);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { cpf } = request.params;
    const dadosParaAtualizar = request.body;
    const { idLoja } = request.user;
    const funcionarioService = new FuncionarioService();

    try {
      const funcionarioAtualizado = await funcionarioService.update(
        idLoja,
        cpf,
        dadosParaAtualizar
      );
      return response.json(funcionarioAtualizado);
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { cpf } = request.params;
    const { idLoja } = request.user;
    const funcionarioService = new FuncionarioService();

    try {
      await funcionarioService.delete(idLoja, cpf);
      return response.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return response.status(404).json({ message: error.message });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  async findPaginated(request: Request, response: Response): Promise<Response> {
    const { idLoja } = request.user;

    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const funcionarioService = new FuncionarioService();

    try {
      const result = await funcionarioService.findPaginated(
        idLoja,
        page,
        limit
      );
      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return response
          .status(500)
          .json({ message: `Erro ao buscar funcionários: ${error.message}` });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }

  /**
   * NOVO: Busca funcionários por um termo de pesquisa, de forma paginada.
   */
  async search(request: Request, response: Response): Promise<Response> {
    const { idLoja } = request.user;

    const { term } = request.query;
    if (!term || typeof term !== "string") {
      return response
        .status(400)
        .json({ message: "O parâmetro de busca 'term' é obrigatório." });
    }

    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const funcionarioService = new FuncionarioService();

    try {
      const result = await funcionarioService.search(idLoja, term, page, limit);
      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return response
          .status(500)
          .json({ message: `Erro ao buscar funcionários: ${error.message}` });
      }
      return response.status(500).json({ message: "Internal Server Error" });
    }
  }
}
