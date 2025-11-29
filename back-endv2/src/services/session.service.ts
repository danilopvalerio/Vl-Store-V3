import { prisma } from "../database/prisma";
import { SessionRepository } from "../repositories/session.repository";
import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/hash";
import { LogService } from "./log.service"; // Importando o LogService
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  LoginDTO,
  RegisterStoreOwnerDTO,
  SessionResponseDTO,
} from "../dtos/session.dto";

export class SessionService {
  private sessionRepo = new SessionRepository();
  private userRepo = new UserRepository();
  private logService = new LogService(); // Instanciando

  // --- LOGIN ---
  // Agora aceita IP e UserAgent (opcionais, com valor padrão string vazia)
  async authenticate(
    data: LoginDTO,
    ip: string = "",
    userAgent: string = ""
  ): Promise<SessionResponseDTO> {
    // 1. Busca User
    const user = await this.userRepo.findByEmail(data.email);

    // Se usuário não existe ou inativo -> LOG DE FALHA
    if (!user || !user.ativo) {
      await this.logService.logAccess({
        ip,
        user_agent: userAgent,
        sucesso: false,
        id_user: undefined, // Não achamos o user, então fica null no banco
      });
      throw new Error("Credenciais inválidas");
    }

    // 2. Valida Senha
    const passwordMatch = await comparePassword(data.senha, user.senha_hash);

    // Se senha errada -> LOG DE FALHA
    if (!passwordMatch) {
      await this.logService.logAccess({
        ip,
        user_agent: userAgent,
        sucesso: false,
        id_user: user.user_id, // Achamos o user, logamos quem tentou
      });
      throw new Error("Credenciais inválidas");
    }

    // 3. Busca o Perfil
    const profile = await prisma.user_profile.findFirst({
      where: { user_id: user.user_id, ativo: true },
      include: { loja: true },
    });

    if (!profile) {
      // LOG DE FALHA (Sem perfil)
      await this.logService.logAccess({
        ip,
        user_agent: userAgent,
        sucesso: false,
        id_user: user.user_id,
      });
      throw new Error("Usuário não possui vínculo com nenhuma loja ativa.");
    }

    // 4. Gera Tokens
    const payload = {
      userId: user.user_id,
      profileId: profile.id_user_profile,
      lojaId: profile.id_loja,
      role: profile.tipo_perfil || "FUNCIONARIO",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(user.user_id);

    // 5. Salva Refresh Token
    await this.sessionRepo.deleteUserTokens(user.user_id);
    await this.sessionRepo.saveRefreshToken(user.user_id, refreshToken);

    // LOG DE SUCESSO (Tudo deu certo)
    await this.logService.logAccess({
      ip,
      user_agent: userAgent,
      sucesso: true,
      id_user: user.user_id,
    });

    const phonesList = user.telefone_user
      ? user.telefone_user.map((t) => t.telefone)
      : [];

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.user_id,
        email: user.email,
        nome: profile.nome,
        role: payload.role,
        lojaId: payload.lojaId,
        telefones: phonesList,
      },
    };
  }

  // --- REFRESH TOKEN ---
  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      verifyRefreshToken(token);
    } catch {
      throw new Error("Refresh token expirado ou inválido");
    }

    const storedToken = await this.sessionRepo.findRefreshToken(token);
    if (!storedToken || !storedToken.ativo) {
      throw new Error("Refresh token inválido");
    }

    const profile = await prisma.user_profile.findFirst({
      where: { user_id: storedToken.id_user, ativo: true },
    });

    if (!profile) throw new Error("Perfil não encontrado ou inativo");

    const accessToken = generateAccessToken({
      userId: storedToken.id_user,
      profileId: profile.id_user_profile,
      lojaId: profile.id_loja,
      role: profile.tipo_perfil || "FUNCIONARIO",
    });

    return { accessToken };
  }

  // --- REGISTER (Dono de Loja) ---
  async registerStoreOwner(
    data: RegisterStoreOwnerDTO
  ): Promise<SessionResponseDTO> {
    const existingUser = await this.userRepo.findByEmail(data.email);
    if (existingUser) throw new Error("Email já cadastrado");

    if (data.telefones && data.telefones.length > 2) {
      throw new Error("Máximo de 2 telefones permitidos");
    }

    const senhaHash = await hashPassword(data.senha);

    const result = await prisma.$transaction(async (tx) => {
      // 1. User
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          senha_hash: senhaHash,
          ativo: true,
        },
      });

      // 2. Telefones
      if (data.telefones && data.telefones.length > 0) {
        await tx.telefone_user.createMany({
          data: data.telefones.map((tel) => ({
            id_user: newUser.user_id,
            telefone: tel,
          })),
        });
      }

      // 3. Loja
      const newLoja = await tx.loja.create({
        data: {
          nome: data.nome_loja,
          cnpj_cpf: data.cnpj_cpf_loja,
          admin_user_id: newUser.user_id,
        },
      });

      // 4. Profile
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

    // --- LOG DE SISTEMA ---
    // Registra que uma nova loja foi criada
    await this.logService.logSystem({
      id_user: result.newUser.user_id,
      acao: "REGISTRO_LOJA",
      detalhes: `Nova loja registrada: ${result.newLoja.nome}`,
    });

    // Auto-Login
    const payload = {
      userId: result.newUser.user_id,
      profileId: result.newProfile.id_user_profile,
      lojaId: result.newLoja.id_loja,
      role: "ADMIN",
    };

    const accessToken = generateAccessToken(payload);
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
        telefones: data.telefones || [],
      },
    };
  }

  // --- LOGOUT ---
  async logout(refreshToken: string): Promise<void> {
    await this.sessionRepo.deleteRefreshToken(refreshToken);
    // Nota: Optei por não logar o logout para manter o código simples,
    // pois precisaríamos buscar o dono do token no banco antes de deletar
    // apenas para ter o ID dele pro log.
  }
}
