import { prisma } from "../../shared/database/prisma";
import { SessionRepository } from "./session.repository";
import { UserRepository } from "../user/user.repository"; // Usa o repositório de user
import { hashPassword, comparePassword } from "../../shared/utils/hash";
import { LogService } from "../logs/log.service";
import { AppError } from "../../app/middleware/error.middleware";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../shared/utils/jwt";
import {
  LoginDTO,
  RegisterStoreOwnerDTO,
  SessionResponseDTO,
} from "./session.dto";

export class SessionService {
  constructor(
    private sessionRepo: SessionRepository,
    private userRepo: UserRepository, // Injetado
    private logService: LogService
  ) {}

  // ==========================================================
  // LOGIN
  // ==========================================================
  async authenticate(
    data: LoginDTO,
    ip: string = "",
    userAgent: string = ""
  ): Promise<SessionResponseDTO> {
    // 1. Busca User pelo Repositório (que retorna UserEntity com senha_hash)
    const user = await this.userRepo.findByEmail(data.email);

    if (!user || !user.ativo) {
      await this.logService.logAccess({
        ip,
        user_agent: userAgent,
        sucesso: false,
      });
      throw new AppError("Email ou senha incorretos.", 401);
    }

    // 2. Compara Senha (UserEntity tem senha_hash)
    const passwordMatch = await comparePassword(data.senha, user.senha_hash);

    if (!passwordMatch) {
      await this.logService.logAccess({
        ip,
        user_agent: userAgent,
        sucesso: false,
        id_user: user.user_id,
      });
      throw new AppError("Email ou senha incorretos.", 401);
    }

    // 3. Busca Perfil
    const profile = await prisma.user_profile.findFirst({
      where: { user_id: user.user_id, ativo: true },
      include: { loja: true },
    });

    if (!profile) {
      await this.logService.logAccess({
        ip,
        user_agent: userAgent,
        sucesso: false,
        id_user: user.user_id,
      });
      throw new AppError(
        "Usuário não possui vínculo com nenhuma loja ativa.",
        403
      );
    }

    // 4. Tokens
    const payload = {
      userId: user.user_id,
      profileId: profile.id_user_profile,
      lojaId: profile.id_loja,
      role: profile.tipo_perfil || "FUNCIONARIO",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(user.user_id);

    await this.sessionRepo.deleteUserTokens(user.user_id);
    await this.sessionRepo.saveRefreshToken(user.user_id, refreshToken);

    await this.logService.logAccess({
      ip,
      user_agent: userAgent,
      sucesso: true,
      id_user: user.user_id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.user_id,
        email: user.email,
        nome: profile.nome,
        role: payload.role,
        lojaId: payload.lojaId,
      },
    };
  }

  // ==========================================================
  // REFRESH
  // ==========================================================
  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      verifyRefreshToken(token);
    } catch {
      throw new AppError("Refresh token expirado ou inválido.", 401);
    }

    const storedToken = await this.sessionRepo.findRefreshToken(token);
    if (!storedToken || !storedToken.ativo) {
      throw new AppError("Refresh token inválido.", 401);
    }

    const profile = await prisma.user_profile.findFirst({
      where: { user_id: storedToken.id_user, ativo: true },
    });

    if (!profile) throw new AppError("Perfil não encontrado.", 403);

    const accessToken = generateAccessToken({
      userId: storedToken.id_user,
      profileId: profile.id_user_profile,
      lojaId: profile.id_loja,
      role: profile.tipo_perfil || "FUNCIONARIO",
    });

    return { accessToken };
  }

  // ==========================================================
  // REGISTER
  // ==========================================================
  async registerStoreOwner(
    data: RegisterStoreOwnerDTO
  ): Promise<SessionResponseDTO> {
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) throw new AppError("Email já cadastrado.", 409);

    const senhaHash = await hashPassword(data.senha);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email: data.email, senha_hash: senhaHash, ativo: true },
      });

      const newLoja = await tx.loja.create({
        data: {
          nome: data.nome_loja,
          cnpj_cpf: data.cnpj_cpf_loja,
          admin_user_id: newUser.user_id,
        },
      });

      const newProfile = await tx.user_profile.create({
        data: {
          user_id: newUser.user_id,
          id_loja: newLoja.id_loja,
          nome: data.nome_usuario,
          cpf_cnpj: data.cpf_usuario,
          tipo_perfil: "ADMIN",
          cargo: "Proprietário",
        },
      });

      return { newUser, newLoja, newProfile };
    });

    await this.logService.logSystem({
      id_user: result.newUser.user_id,
      acao: "REGISTRO_LOJA",
      detalhes: `Nova loja registrada: ${result.newLoja.nome}`,
    });

    const accessToken = generateAccessToken({
      userId: result.newUser.user_id,
      profileId: result.newProfile.id_user_profile,
      lojaId: result.newLoja.id_loja,
      role: "ADMIN",
    });

    const refreshToken = generateRefreshToken(result.newUser.user_id);
    await this.sessionRepo.saveRefreshToken(
      result.newUser.user_id,
      refreshToken
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.newUser.user_id,
        email: result.newUser.email,
        nome: result.newProfile.nome,
        role: "ADMIN",
        lojaId: result.newLoja.id_loja,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionRepo.deleteRefreshToken(refreshToken);
  }
}
