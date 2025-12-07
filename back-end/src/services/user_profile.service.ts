import { UserProfileRepository } from "../repositories/user_profile.repository";
import { user_profile as UserProfile } from "../generated/prisma/client"; // Ajuste o import conforme seu gerador
import {
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
} from "../dtos/user_profile.dto";
import { LogService } from "./log.service";
import { AppError } from "../middlewares/error.middleware";

export class UserProfileService {
  private repo: UserProfileRepository;
  private logService: LogService;

  constructor() {
    this.repo = new UserProfileRepository();
    this.logService = new LogService();
  }

  // ============================================================================
  // CREATE PROFILE
  // ============================================================================
  async createProfile(
    data: CreateUserProfileDTO,
    actorUserId: string
  ): Promise<UserProfile> {
    // 1. Verifica se usuário já tem perfil NESTA loja
    // O repository foi atualizado para aceitar (userId, lojaId)
    const userHasProfile = await this.repo.findByUserId(
      data.user_id,
      data.id_loja
    );

    if (userHasProfile) {
      throw new AppError(
        "Este usuário já possui um perfil cadastrado nesta loja.",
        409
      );
    }

    // 2. Verifica se CPF já existe NESTA loja
    if (data.cpf_cnpj) {
      const existing = await this.repo.findByCpfCnpj(
        data.cpf_cnpj,
        data.id_loja
      );
      if (existing) {
        throw new AppError("Este CPF/CNPJ já está cadastrado nesta loja.", 409);
      }
    }

    // 3. Bloqueio de Segurança
    if (data.tipo_perfil === "SUPER_ADMIN") {
      throw new AppError(
        "Criação de perfis SUPER_ADMIN não permitida por esta rota.",
        403
      );
    }

    // 4. Criação
    const newProfile = await this.repo.create({
      user_id: data.user_id,
      id_loja: data.id_loja,
      nome: data.nome,
      cpf_cnpj: data.cpf_cnpj,
      cargo: data.cargo,
      tipo_perfil: data.tipo_perfil,
    });

    // 5. Log
    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Criar Perfil",
      detalhes: `Perfil criado para '${data.nome}'. Loja ID: ${data.id_loja}. Cargo: ${data.cargo}.`,
    });

    return newProfile;
  }

  // ============================================================================
  // UPDATE PROFILE
  // ============================================================================
  async updateProfile(
    id: string,
    data: UpdateUserProfileDTO,
    actorUserId: string
  ): Promise<UserProfile> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Perfil não encontrado.", 404);

    // 1. Validação de CPF duplicado (Contexto da Loja)
    if (data.cpf_cnpj && data.cpf_cnpj !== existing.cpf_cnpj) {
      // Busca se existe esse CPF na MESMA loja do perfil que estamos editando
      const docExists = await this.repo.findByCpfCnpj(
        data.cpf_cnpj,
        existing.id_loja
      );

      // Se encontrou alguém E não sou eu mesmo
      if (docExists && docExists.id_user_profile !== id) {
        throw new AppError(
          "Este CPF/CNPJ já está cadastrado para outro usuário nesta loja.",
          409
        );
      }
    }

    // 2. Bloqueio de Segurança
    if (data.tipo_perfil === "SUPER_ADMIN") {
      throw new AppError(
        "Alteração manual para SUPER_ADMIN não permitida.",
        403
      );
    }

    const updateData: Partial<UserProfile> = {};
    const mudancas: string[] = [];

    // 3. Mapeamento de Mudanças
    if (data.nome && data.nome !== existing.nome) {
      updateData.nome = data.nome;
      mudancas.push(`Nome alterado de '${existing.nome}' para '${data.nome}'`);
    }

    if (data.cpf_cnpj && data.cpf_cnpj !== existing.cpf_cnpj) {
      updateData.cpf_cnpj = data.cpf_cnpj;
      mudancas.push(`CPF atualizado`);
    }

    if (data.cargo && data.cargo !== existing.cargo) {
      updateData.cargo = data.cargo;
      mudancas.push(
        `Cargo alterado de '${existing.cargo}' para '${data.cargo}'`
      );
    }

    if (data.tipo_perfil && data.tipo_perfil !== existing.tipo_perfil) {
      updateData.tipo_perfil = data.tipo_perfil;
      mudancas.push(
        `Permissão alterada de '${existing.tipo_perfil}' para '${data.tipo_perfil}'`
      );
    }

    if (typeof data.ativo !== "undefined" && data.ativo !== existing.ativo) {
      updateData.ativo = data.ativo;
      mudancas.push(`Status alterado para ${data.ativo ? "Ativo" : "Inativo"}`);
    }

    // 4. Executa Update (se houver dados)
    let updatedProfile = existing;
    if (Object.keys(updateData).length > 0) {
      updatedProfile = await this.repo.updateById(id, updateData);
    }

    // 5. Log (Só se houve mudança)
    if (mudancas.length > 0) {
      await this.logService.logSystem({
        id_user: actorUserId,
        acao: "Atualizar Perfil",
        detalhes: `Perfil de ${
          existing.nome
        } (ID: ${id}) alterado. Detalhes: ${mudancas.join(". ")}.`,
      });
    }

    return updatedProfile;
  }

  // ============================================================================
  // DELETE PROFILE
  // ============================================================================
  async deleteProfile(id: string, actorUserId: string): Promise<UserProfile> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Perfil não encontrado.", 404);

    const deletedProfile = await this.repo.deleteById(id);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Perfil",
      detalhes: `O perfil do funcionário '${existing.nome}' (ID: ${id}) foi removido.`,
    });

    return deletedProfile;
  }

  // ============================================================================
  // LEITURAS (Delegam para o Repositório)
  // ============================================================================

  async getProfileById(id: string): Promise<UserProfile | null> {
    return this.repo.findById(id);
  }

  // Agora busca considerando a loja se possível, mas mantemos a assinatura flexível
  async getProfileByUserId(
    userId: string,
    lojaId?: string
  ): Promise<UserProfile | null> {
    return this.repo.findByUserId(userId, lojaId);
  }

  async getAllProfiles(): Promise<UserProfile[]> {
    return this.repo.findAll();
  }

  async getProfilesPaginated(page = 1, perPage = 10, lojaId?: string) {
    return this.repo.findPaginated(page, perPage, lojaId);
  }

  async searchProfiles(term: string, page = 1, perPage = 10, lojaId?: string) {
    const cleanedTerm = term?.trim() ?? "";
    if (cleanedTerm.length === 0) {
      // Retorna estrutura vazia de paginação se não tiver termo
      return {
        data: [],
        total: 0,
        page,
        perPage,
        totalPages: 0,
      };
    }
    return this.repo.searchPaginated(cleanedTerm, page, perPage, lojaId);
  }
}
