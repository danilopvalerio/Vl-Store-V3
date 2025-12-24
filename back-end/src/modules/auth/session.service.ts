import { prisma } from "../../shared/database/prisma";
import { SessionRepository } from "./session.repository";
import { UserRepository } from "../user/user.repository";
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
    private userRepo: UserRepository,
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
    // 1. Busca User
    const user = await this.userRepo.findByEmail(data.email);

    if (!user || !user.ativo) {
      // Log de falha (segurança)
      await this.logService.logAccess({
        ip,
        user_agent: userAgent,
        sucesso: false,
      });
      throw new AppError("Email ou senha incorretos.", 401);
    }

    // 2. Compara Senha
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

    // 3. Busca Perfil Ativo
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

    // Rotaciona o token (apaga antigos, salva novo)
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

    // Busca perfil novamente para garantir permissões atualizadas
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
    // Validação de Duplicidade (Regra de Negócio)
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) throw new AppError("Email já cadastrado.", 409);

    const senhaHash = await hashPassword(data.senha);

    // Transação: User -> Loja -> Profile
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
          tipo_perfil: "ADMIN", // Primeiro user é sempre ADMIN da loja
          cargo: "Proprietário",
        },
      });

      return { newUser, newLoja, newProfile };
    });

    // Log de Sistema
    await this.logService.logSystem({
      id_user: result.newUser.user_id,
      acao: "REGISTRO_LOJA",
      detalhes: `Nova loja registrada: ${result.newLoja.nome}`,
    });

    // Gera tokens para já logar o usuário
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
