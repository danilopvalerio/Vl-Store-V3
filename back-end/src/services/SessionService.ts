//src/services/SessionService.ts
import { AppDataSource } from "../database/data-source";
import Loja from "../models/Loja";
import Funcionario from "../models/Funcionario";
import RefreshToken from "../models/RefreshToken";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { addDays } from "date-fns";
import { SignOptions } from "jsonwebtoken";

interface ISessionRequest {
  email: string;
  senha: string;
  user_role: "admin" | "employee";
}

interface LojaDTO {
  idLoja: string;
  nome: string;
  email: string;
}

interface FuncionarioDTO {
  cpf: string;
  nome: string;
  email: string;
  cargo: string;
  idLoja: string;
  nomeLoja?: string;
}
export class SessionService {
  async create({ email, senha, user_role }: ISessionRequest) {
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

    if (user_role === "admin") {
      const lojaRepository = AppDataSource.getRepository(Loja);
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

      const tokenPayload = { id_loja: loja.id_loja, user_role: "admin" };
      const tokenSubject = loja.id_loja;

      await refreshTokenRepository.delete({ id_loja: loja.id_loja });

      const accessToken = jwt.sign(
        tokenPayload,
        process.env.ACCESS_TOKEN_SECRET as string,
        {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
          subject: tokenSubject,
        } as SignOptions
      );

      const refreshToken = jwt.sign(
        tokenPayload,
        process.env.REFRESH_TOKEN_SECRET as string,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
          subject: tokenSubject,
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

      return { user: lojaDTO, accessToken, refreshToken, role: "admin" };
    } else if (user_role === "employee") {
      const funcionarioRepository = AppDataSource.getRepository(Funcionario);
      const funcionario = await funcionarioRepository
        .createQueryBuilder("funcionario")
        .addSelect("funcionario.senha")
        .where("funcionario.email = :email", { email })
        .getOne();

      if (!funcionario) {
        throw new Error("E-mail ou senha incorretos.");
      }

      const senhaCorreta = await bcrypt.compare(senha, funcionario.senha);
      if (!senhaCorreta) {
        throw new Error("E-mail ou senha incorretos.");
      }

      const tokenPayload = {
        id_loja: funcionario.idLoja,
        user_role: "employee",
      };
      const tokenSubject = funcionario.cpf;

      await refreshTokenRepository.delete({ id_loja: funcionario.idLoja });

      const accessToken = jwt.sign(
        tokenPayload,
        process.env.ACCESS_TOKEN_SECRET as string,
        {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
          subject: tokenSubject,
        } as SignOptions
      );

      const refreshToken = jwt.sign(
        tokenPayload,
        process.env.REFRESH_TOKEN_SECRET as string,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
          subject: tokenSubject,
        } as SignOptions
      );

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      const refreshTokenExpiresAt = addDays(new Date(), 7);

      const newRefreshToken = refreshTokenRepository.create({
        hashedToken: hashedRefreshToken,
        id_loja: funcionario.idLoja,
        expiresAt: refreshTokenExpiresAt,
      });
      await refreshTokenRepository.save(newRefreshToken);

      const funcionarioDTO: FuncionarioDTO = {
        cpf: funcionario.cpf,
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo,
        idLoja: funcionario.idLoja,
      };

      return {
        user: funcionarioDTO,
        accessToken,
        refreshToken,
        role: "employee",
      };
    } else {
      throw new Error("Tipo de usuário inválido.");
    }
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

    return { accessToken };
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

  /**
   * Lógica de negócio para buscar o perfil do usuário (loja ou funcionário).
   */
  async getProfile(
    userId: string,
    role: "admin" | "employee"
  ): Promise<LojaDTO | FuncionarioDTO> {
    if (role === "admin") {
      const lojaRepository = AppDataSource.getRepository(Loja);
      // Para admin, o userId é o id_loja
      const loja = await lojaRepository.findOneBy({ id_loja: userId });

      if (!loja) {
        throw new Error("Perfil da loja não encontrado.");
      }

      const lojaDTO: LojaDTO = {
        idLoja: loja.id_loja,
        nome: loja.nome,
        email: loja.email,
      };
      return lojaDTO;
    } else if (role === "employee") {
      const lojaRepository = AppDataSource.getRepository(Loja);
      const funcionarioRepository = AppDataSource.getRepository(Funcionario);

      const funcionario = await funcionarioRepository.findOneBy({
        cpf: userId,
      });

      if (!funcionario) {
        throw new Error("Perfil do funcionário não encontrado.");
      }

      const loja = await lojaRepository.findOneBy({
        id_loja: funcionario.idLoja,
      });
      if (!loja) {
        throw new Error("Perfil da loja não encontrado.");
      }

      const funcionarioDTO: FuncionarioDTO = {
        cpf: funcionario.cpf,
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo,
        idLoja: funcionario.idLoja,
        nomeLoja: loja.nome,
      };
      return funcionarioDTO;
    } else {
      throw new Error("Tipo de perfil inválido.");
    }
  }
}
