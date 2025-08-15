import { AppDataSource } from "../database/data-source";
import Loja from "../models/Loja";
import RefreshToken from "../models/RefreshToken";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { addDays } from "date-fns";
import { SignOptions } from "jsonwebtoken";

interface ISessionRequest {
  email: string;
  senha: string;
}

interface LojaDTO {
  idLoja: string;
  nome: string;
  email: string;
}

export class SessionService {
  // O método create permanece o mesmo
  async create({ email, senha }: ISessionRequest) {
    const lojaRepository = AppDataSource.getRepository(Loja);
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

    const loja = await lojaRepository
      .createQueryBuilder("loja")
      .addSelect("loja.senha")
      .where("loja.email = :email", { email })
      .getOne();

    if (!loja) {
      throw new Error("E-mail ou senha incorretos.");
    }

    const senhaCorreta = await bcrypt.compare(senha, loja.senha);
    if (!senhaCorreta) {
      throw new Error("E-mail ou senha incorretos.");
    }

    // Remove refresh tokens antigos dessa loja antes de gerar um novo
    await refreshTokenRepository.delete({ id_loja: loja.id_loja });

    const accessToken = jwt.sign(
      { id_loja: loja.id_loja },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
        subject: loja.id_loja,
      } as SignOptions
    );

    const refreshToken = jwt.sign(
      { id_loja: loja.id_loja },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
        subject: loja.id_loja,
      } as SignOptions
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiresAt = addDays(new Date(), 7);

    const newRefreshToken = refreshTokenRepository.create({
      hashedToken: hashedRefreshToken,
      id_loja: loja.id_loja,
      expiresAt: refreshTokenExpiresAt,
    });
    await refreshTokenRepository.save(newRefreshToken);

    const lojaDTO: LojaDTO = {
      idLoja: loja.id_loja,
      nome: loja.nome,
      email: loja.email,
    };

    return { loja: lojaDTO, accessToken, refreshToken };
  }

  /**
   * Lógica de negócio para atualizar um token.
   */
  async refresh(refreshToken: string) {
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const lojaRepository = AppDataSource.getRepository(Loja);

    const allTokens = await refreshTokenRepository.find();
    const foundToken = await Promise.any(
      allTokens.map(async (token) => {
        const match = await bcrypt.compare(refreshToken, token.hashedToken);
        // Garante que o token encontrado não foi revogado (caso a lógica mude no futuro)
        return match && !token.revokedAt ? token : Promise.reject();
      })
    ).catch(() => null);

    // Verifica se o token foi encontrado e se não expirou.
    if (!foundToken) {
      throw new Error("Refresh token inválido/expirado.");
    }

    const loja = await lojaRepository.findOneBy({
      id_loja: foundToken.id_loja,
    });
    if (!loja) {
      throw new Error("Loja não encontrada.");
    }

    const accessToken = jwt.sign(
      { id_loja: loja.id_loja },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
        subject: loja.id_loja,
      } as SignOptions
    );

    const lojaDTO: LojaDTO = {
      idLoja: loja.id_loja,
      nome: loja.nome,
      email: loja.email,
    };

    return { loja: lojaDTO, accessToken };
  }

  /**
   * Lógica de negócio para fazer logout.
   * AGORA REMOVE O REFRESH TOKEN DO BANCO DE DADOS.
   */
  async logout(refreshToken: string) {
    if (!refreshToken) {
      return;
    }

    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

    try {
      // Extrai o id_loja do payload do refresh token sem precisar validar assinatura
      const decoded = jwt.decode(refreshToken) as { id_loja: string } | null;

      if (!decoded?.id_loja) {
        return; // Token inválido
      }

      // Busca todos os tokens dessa loja no banco
      const tokensDaLoja = await refreshTokenRepository.find({
        where: { id_loja: decoded.id_loja },
      });

      // Compara com bcrypt e remove se encontrar
      for (const token of tokensDaLoja) {
        const match = await bcrypt.compare(refreshToken, token.hashedToken);
        if (match) {
          await refreshTokenRepository.remove(token); // Invalida
          break;
        }
      }
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  }

  // O método getProfile permanece o mesmo
  async getProfile(idLoja: string): Promise<LojaDTO> {
    const lojaRepository = AppDataSource.getRepository(Loja);
    const loja = await lojaRepository.findOneBy({ id_loja: idLoja });

    if (!loja) {
      throw new Error("Loja não encontrada.");
    }

    const lojaDTO: LojaDTO = {
      idLoja: loja.id_loja,
      nome: loja.nome,
      email: loja.email,
    };

    return lojaDTO;
  }
}
