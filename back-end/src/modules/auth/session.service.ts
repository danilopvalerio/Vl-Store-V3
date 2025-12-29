import { prisma } from "../../shared/database/prisma";
import { SessionRepository } from "./session.repository";
import { UserRepository } from "../user/user.repository";
import { LogService } from "../logs/log.service";
import { AppError } from "../../app/middleware/error.middleware";
import { hashPassword, comparePassword } from "../../shared/utils/hash";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "../../shared/utils/jwt"; // Ajuste o caminho se seu jwt.ts estiver em outro lugar
import {
  LoginDTO,
  RegisterStoreOwnerDTO,
  SessionResponseDTO,
  SelectStoreDTO,
} from "./session.dto";

// TIPOS DO PRISMA (Importados para evitar 'any')
import {
  user,
  user_profile,
  loja,
} from "../../shared/database/generated/prisma/client";

// Tipo auxiliar para o Perfil com Loja (usado nos includes do Prisma)
type ProfileWithLoja = user_profile & { loja: loja };

export class SessionService {
  constructor(
    private sessionRepo: SessionRepository,
    private userRepo: UserRepository,
    private logService: LogService
  ) {}

  // ==========================================================================
  // LOGIN (Híbrido: Direto ou Lista de Lojas)
  // ==========================================================================
  async authenticate(
    data: LoginDTO,
    ip: string,
    userAgent: string
  ): Promise<SessionResponseDTO> {
    // 1. Busca User
    const user = await this.userRepo.findByEmail(data.email);

    if (!user || !user.ativo) {
      await this.logService.logAccess({
        ip,
        user_agent: userAgent,
        sucesso: false,
      });
      throw new AppError("Email ou senha incorretos.", 401);
    }

    // 2. Compara Senha
    const match = await comparePassword(data.senha, user.senha_hash);
    if (!match) {
      await this.logService.logAccess({
        ip,
        user_agent: userAgent,
        sucesso: false,
        id_user: user.user_id,
      });
      throw new AppError("Email ou senha incorretos.", 401);
    }

    // 3. Busca PERFIS ATIVOS (Join com Loja)
    const profiles = await prisma.user_profile.findMany({
      where: { user_id: user.user_id, status: "ACTIVE" },
      include: { loja: true },
    });

    if (profiles.length === 0) {
      throw new AppError(
        "Usuário não possui vínculo com nenhuma loja ativa.",
        403
      );
    }

    // --- CENÁRIO A: Múltiplas Lojas ---
    if (profiles.length > 1) {
      // Gera token temporário (Pre-Auth)
      // "PENDING" é string, então satisfaz a interface TokenPayload
      const preAuthPayload: TokenPayload = {
        userId: user.user_id,
        profileId: "PENDING",
        lojaId: "PENDING",
        role: "PRE_AUTH",
      };

      // Agora funciona porque atualizamos o jwt.ts para aceitar o segundo argumento
      const preAuthToken = generateAccessToken(preAuthPayload, "10m");

      return {
        accessToken: preAuthToken,
        multiProfile: true,
        profiles: profiles.map((p) => ({
          id: p.id_user_profile,
          lojaName: p.loja.nome,
          cargo: p.cargo || "Funcionário",
        })),
      };
    }

    // --- CENÁRIO B: Loja Única ---
    const profile = profiles[0];
    // Passamos 'user' (que veio do Repo mas é compatível com o tipo Prisma user)
    // Precisamos garantir a tipagem correta no generateFinalSession
    return this.generateFinalSession(
      user as unknown as user,
      profile,
      ip,
      userAgent
    );
  }

  // ==========================================================================
  // SELECIONAR LOJA
  // ==========================================================================
  async selectStore(
    userId: string,
    data: SelectStoreDTO,
    ip: string,
    userAgent: string
  ): Promise<SessionResponseDTO> {
    const profile = await prisma.user_profile.findFirst({
      where: {
        id_user_profile: data.profileId,
        user_id: userId,
        status: "ACTIVE",
      },
      include: { loja: true },
    });

    if (!profile) {
      throw new AppError("Perfil inválido ou sem permissão.", 403);
    }

    // Busca usuário pelo Prisma direto para garantir o tipo 'user'
    const userData = await prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (!userData) throw new AppError("Usuário não encontrado.", 404);

    return this.generateFinalSession(userData, profile, ip, userAgent);
  }

  // ==========================================================================
  // HELPER: Gerar Sessão Final (Tipado)
  // ==========================================================================
  private async generateFinalSession(
    userEntity: user,
    profileEntity: ProfileWithLoja,
    ip: string,
    userAgent: string
  ): Promise<SessionResponseDTO> {
    const payload: TokenPayload = {
      userId: userEntity.user_id,
      profileId: profileEntity.id_user_profile,
      lojaId: profileEntity.id_loja,
      role: profileEntity.tipo_perfil || "FUNCIONARIO",
    };

    const accessToken = generateAccessToken(payload); // Usa padrão do env/constante
    const refreshToken = generateRefreshToken(userEntity.user_id);

    await this.sessionRepo.deleteUserTokens(userEntity.user_id);
    await this.sessionRepo.saveRefreshToken(userEntity.user_id, refreshToken);

    await this.logService.logAccess({
      ip,
      user_agent: userAgent,
      sucesso: true,
      id_user: userEntity.user_id,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userEntity.user_id,
        email: userEntity.email,
        nome: profileEntity.nome,
        role: payload.role,
        lojaId: payload.lojaId,
      },
    };
  }

  // ==========================================================================
  // REFRESH TOKEN
  // ==========================================================================
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

    // Busca o primeiro perfil ativo (simplificação da lógica de refresh)
    const profile = await prisma.user_profile.findFirst({
      where: { user_id: storedToken.id_user, status: "ACTIVE" },
    });

    if (!profile) throw new AppError("Perfil não encontrado.", 403);

    const payload: TokenPayload = {
      userId: storedToken.id_user,
      profileId: profile.id_user_profile,
      lojaId: profile.id_loja,
      role: profile.tipo_perfil || "FUNCIONARIO",
    };

    const accessToken = generateAccessToken(payload);

    return { accessToken };
  }

  // ==========================================================================
  // REGISTER
  // ==========================================================================
  async registerStoreOwner(
    data: RegisterStoreOwnerDTO
  ): Promise<SessionResponseDTO> {
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) throw new AppError("Email já cadastrado.", 409);

    const senhaHash = await hashPassword(data.senha);

    // Transação do Prisma retorna tipos inferidos automaticamente
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
        include: { loja: true }, // Inclui loja para satisfazer o tipo ProfileWithLoja
      });

      return { newUser, newLoja, newProfile };
    });

    await this.logService.logSystem({
      id_user: result.newUser.user_id,
      acao: "REGISTRO_LOJA",
      detalhes: `Nova loja: ${result.newLoja.nome}`,
    });

    return this.generateFinalSession(
      result.newUser,
      result.newProfile, // O tipo inferido aqui já contém a loja devido ao 'include'
      "REGISTRO",
      "SISTEMA"
    );
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionRepo.deleteRefreshToken(refreshToken);
  }

  async getMyProfiles(userId: string) {
    const profiles = await prisma.user_profile.findMany({
      where: { user_id: userId, status: "ACTIVE" },
      include: { loja: true },
    });

    return profiles.map((p) => ({
      id: p.id_user_profile,
      lojaName: p.loja.nome,
      cargo: p.cargo || "Funcionário",
    }));
  }
}
