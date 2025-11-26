import { Request, Response } from "express";
import { SessionService } from "../services/session.service";
import {
  LoginDTO,
  RegisterStoreOwnerDTO,
  RefreshTokenDTO,
} from "../dtos/session.dto";
import {
  isValidEmail,
  isValidString,
  isValidPhoneArray,
} from "../utils/validation";

const sessionService = new SessionService();

export class SessionController {
  // POST /auth/login
  async login(req: Request, res: Response) {
    try {
      const body = req.body as LoginDTO;
      if (!isValidEmail(body.email))
        return res.status(400).json({ error: "Email inválido" });
      if (!isValidString(body.senha))
        return res.status(400).json({ error: "Senha requerida" });

      const result = await sessionService.authenticate(body);
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro na autenticação";
      // Não dê muitos detalhes no 401 por segurança
      res.status(401).json({ error: msg });
    }
  }

  // POST /auth/refresh
  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body as RefreshTokenDTO;
      if (!refreshToken)
        return res.status(400).json({ error: "Token obrigatório" });

      const result = await sessionService.refreshToken(refreshToken);
      res.json(result);
    } catch (err) {
      res.status(403).json({ error: "Token inválido" });
    }
  }

  // POST /auth/register
  async register(req: Request, res: Response) {
    try {
      const body = req.body as RegisterStoreOwnerDTO;

      if (!isValidEmail(body.email))
        return res.status(400).json({ error: "Email inválido" });
      if (!isValidString(body.senha, 6))
        return res.status(400).json({ error: "Senha fraca (min 6)" });
      if (!isValidString(body.nome_loja))
        return res.status(400).json({ error: "Nome da loja requerido" });
      if (!isValidString(body.nome_usuario))
        return res.status(400).json({ error: "Nome do usuário requerido" });

      if (!isValidPhoneArray(body.telefones)) {
        return res.status(400).json({ error: "Telefones inválidos" });
      }

      const result = await sessionService.registerStoreOwner(body);
      res.status(201).json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no registro";
      res.status(400).json({ error: msg });
    }
  }

  // POST /auth/logout
  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body as RefreshTokenDTO;

      // Se não enviou token, tecnicamente o logout "já aconteceu" ou é irrelevante,
      // mas validamos para manter o padrão.
      if (!isValidString(refreshToken)) {
        return res
          .status(400)
          .json({ error: "Refresh token é obrigatório para logout" });
      }

      await sessionService.logout(refreshToken);

      // 204: Deu certo e não tenho nada para te mostrar
      res.status(204).send();
    } catch (err) {
      // Mesmo se der erro interno, para o usuário final o logout "falhou",
      // mas por segurança retornamos sucesso ou erro genérico.
      const msg = err instanceof Error ? err.message : "Erro no logout";
      res.status(500).json({ error: msg });
    }
  }
}
