// src/services/session.service.ts
import { prisma } from "../database/prisma";
import { SessionRepository } from "../repositories/session.repository";
import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/hash";
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

  // --- LOGIN ---
  async authenticate(data: LoginDTO): Promise<SessionResponseDTO> {
    // 1. Busca User (Identity)
    const user = await this.userRepo.findByEmail(data.email);
    if (!user || !user.ativo) throw new Error("Credenciais inválidas");

    // 2. Valida Senha
    const passwordMatch = await comparePassword(data.senha, user.senha_hash);
    if (!passwordMatch) throw new Error("Credenciais inválidas");

    // 3. Busca o Perfil (Contexto)
    // OBS: Se o usuário tiver mais de um perfil (várias lojas),
    // aqui pegamos o primeiro ativo.
    // Futuramente, você pode enviar o 'lojaId' no LoginDTO para escolher em qual loja logar.
    const profile = await prisma.user_profile.findFirst({
      where: { user_id: user.user_id, ativo: true },
      include: { loja: true },
    });

    if (!profile)
      throw new Error("Usuário não possui vínculo com nenhuma loja ativa.");

    // 4. Gera Payload do Token com as permissões DESTE perfil
    const payload = {
      userId: user.user_id,
      profileId: profile.id_user_profile,
      lojaId: profile.id_loja,
      role: profile.tipo_perfil || "FUNCIONARIO", // Fallback
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(user.user_id);

    // 5. Salva Refresh Token
    await this.sessionRepo.deleteUserTokens(user.user_id); // Single session (opcional)
    await this.sessionRepo.saveRefreshToken(user.user_id, refreshToken);

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
    // Verifica assinatura
    try {
      verifyRefreshToken(token);
    } catch {
      throw new Error("Refresh token expirado ou inválido");
    }

    // Verifica no banco
    const storedToken = await this.sessionRepo.findRefreshToken(token);
    if (!storedToken || !storedToken.ativo) {
      throw new Error("Refresh token inválido");
    }

    // Busca o perfil novamente para garantir permissões atualizadas
    const profile = await prisma.user_profile.findFirst({
      where: { user_id: storedToken.id_user, ativo: true },
    });

    if (!profile) throw new Error("Perfil não encontrado ou inativo");

    // Gera novo Access Token
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

    // TRANSAÇÃO COMPLEXA
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria User
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

      // 3. Cria Loja (Sem validar CNPJ único globalmente, pois removemos a constraint)
      // Mas se quiser validar se JÁ EXISTE NESTA CONTA, teria que buscar antes.
      const newLoja = await tx.loja.create({
        data: {
          nome: data.nome_loja,
          cnpj_cpf: data.cnpj_cpf_loja,
          admin_user_id: newUser.user_id,
        },
      });

      // 4. Cria Profile ADMIN
      // Aqui usamos data.cpf_usuario. O banco vai validar se já existe ESSE CPF nesta LOJA.
      const newProfile = await tx.user_profile.create({
        data: {
          user_id: newUser.user_id,
          id_loja: newLoja.id_loja,
          nome: data.nome_usuario,
          cpf_cnpj: data.cpf_usuario,
          tipo_perfil: "ADMIN", // Dono que se cadastra é ADMIN
          cargo: "Proprietário",
        },
      });

      return { newUser, newLoja, newProfile };
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

  async logout(refreshToken: string): Promise<void> {
    // Apenas manda apagar. Não precisamos validar se é válido ou expirado.
    // Se o usuário quer sair, apenas garantimos que esse token saia do banco.
    await this.sessionRepo.deleteRefreshToken(refreshToken);
  }
}
