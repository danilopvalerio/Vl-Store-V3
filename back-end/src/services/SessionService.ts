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

    return {
      loja: lojaDTO,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const lojaRepository = AppDataSource.getRepository(Loja);

    const allTokens = await refreshTokenRepository.find();
    const foundToken = await Promise.any(
      allTokens.map(async (token) => {
        const match = await bcrypt.compare(refreshToken, token.hashedToken);
        return match ? token : Promise.reject();
      })
    ).catch(() => null);

    if (!foundToken || foundToken.expiresAt < new Date()) {
      throw new Error("Refresh token inválido ou expirado.");
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

  async logout(refreshToken: string) {
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const allTokens = await refreshTokenRepository.find();

    for (const token of allTokens) {
      const match = await bcrypt.compare(refreshToken, token.hashedToken);
      if (match) {
        await refreshTokenRepository.remove(token);
        break;
      }
    }
  }
}
