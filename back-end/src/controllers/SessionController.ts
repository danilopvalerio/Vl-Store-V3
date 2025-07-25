import { Request, Response } from "express";
import { SessionService } from "../services/SessionService";

export class SessionController {
  async create(request: Request, response: Response): Promise<Response> {
    // Pega o e-mail e a senha que o usuário enviou no corpo da requisição
    const { email, senha } = request.body;

    const sessionService = new SessionService();

    try {
      // Tenta executar a lógica de login do nosso service
      const { loja, token } = await sessionService.create({ email, senha });

      // Nós configuramos o cookie com o token e todos os atributos de segurança
      response.cookie(
        "token", // Nome do cookie
        token, // O valor (o próprio JWT)
        {
          httpOnly: true, // Impede acesso via JavaScript
          secure: process.env.NODE_ENV !== "development", // 'true' em produção (HTTPS), 'false' em dev (HTTP)
          sameSite: "strict", // Protege contra CSRF
          maxAge: 24 * 60 * 60 * 1000, // Tempo de vida do cookie em milissegundos (ex: 1 dia)
        }
      );

      // Se deu certo, devolve a resposta para o usuário
      return response.json({ loja });
    } catch (error) {
      // Se o service deu algum erro (ex: senha errada), devolvemos o erro
      if (error instanceof Error) {
        return response.status(401).json({ message: error.message }); // 401: Não Autorizado
      }
      return response.status(500).json({ message: "Erro interno no servidor" });
    }
  }
}
