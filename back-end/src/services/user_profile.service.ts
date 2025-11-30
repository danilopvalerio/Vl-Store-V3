import { UserProfileRepository } from "../repositories/user_profile.repository";
import { user_profile as UserProfile } from "../generated/prisma/client";
import {
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
} from "../dtos/user_profile.dto";
import { LogService } from "./log.service";

export class UserProfileService {
  private repo = new UserProfileRepository();
  private logService = new LogService();

  // ============================================================================
  // CREATE PROFILE
  // ============================================================================
  async createProfile(
    data: CreateUserProfileDTO,
    actorUserId: string
  ): Promise<UserProfile> {
    const userHasProfile = await this.repo.findByUserId(data.user_id);
    if (userHasProfile) {
      throw new Error("Usuário já possui um perfil cadastrado.");
    }

    if (data.cpf_cnpj) {
      const existing = await this.repo.findByCpfCnpj(data.cpf_cnpj);
      if (existing) {
        throw new Error("O CPF/CNPJ já está cadastrado.");
      }
    }

    if (data.tipo_perfil === "SUPER_ADMIN") {
      throw new Error("Criação de perfis SUPER_ADMIN não permitida.");
    }

    const newProfile = await this.repo.create({
      user_id: data.user_id,
      id_loja: data.id_loja,
      nome: data.nome,
      cpf_cnpj: data.cpf_cnpj,
      cargo: data.cargo,
      tipo_perfil: data.tipo_perfil,
    });

    // Log de Sistema
    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Criar Perfil",
      detalhes: `Perfil de funcionário criado para '${data.nome}'. Cargo: ${data.cargo}, Permissão: ${data.tipo_perfil}.`,
    });

    return newProfile;
  }

  // ============================================================================
  // UPDATE PROFILE (Com Detalhamento)
  // ============================================================================
  async updateProfile(
    id: string,
    data: UpdateUserProfileDTO,
    actorUserId: string
  ): Promise<UserProfile> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error("Perfil não encontrado.");

    // Validações
    if (data.cpf_cnpj && data.cpf_cnpj !== existing.cpf_cnpj) {
      const docExists = await this.repo.findByCpfCnpj(data.cpf_cnpj);
      if (docExists) throw new Error("O CPF/CNPJ já está cadastrado.");
    }

    if (data.tipo_perfil === "SUPER_ADMIN") {
      throw new Error("Alteração para SUPER_ADMIN não permitida.");
    }

    const updateData: Partial<UserProfile> = {};
    const mudancas: string[] = []; // Lista de alterações para o log

    // 1. Verifica Nome
    if (data.nome && data.nome !== existing.nome) {
      updateData.nome = data.nome;
      mudancas.push(`Nome alterado de '${existing.nome}' para '${data.nome}'`);
    }

    // 2. Verifica CPF
    if (data.cpf_cnpj && data.cpf_cnpj !== existing.cpf_cnpj) {
      updateData.cpf_cnpj = data.cpf_cnpj;
      mudancas.push(`Documento (CPF) atualizado`);
    }

    // 3. Verifica Cargo
    if (data.cargo && data.cargo !== existing.cargo) {
      updateData.cargo = data.cargo;
      mudancas.push(
        `Cargo alterado de '${existing.cargo}' para '${data.cargo}'`
      );
    }

    // 4. Verifica Tipo de Perfil
    if (data.tipo_perfil && data.tipo_perfil !== existing.tipo_perfil) {
      updateData.tipo_perfil = data.tipo_perfil;
      mudancas.push(
        `Permissão alterada de '${existing.tipo_perfil}' para '${data.tipo_perfil}'`
      );
    }

    // 5. Verifica Status
    if (typeof data.ativo !== "undefined" && data.ativo !== existing.ativo) {
      updateData.ativo = data.ativo;
      mudancas.push(`Perfil ${data.ativo ? "ativado" : "desativado"}`);
    }

    // Executa Update
    const updatedProfile = await this.repo.updateById(id, updateData);

    // Log de Sistema (Só se mudou algo)
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
    if (!existing) throw new Error("Perfil não encontrado");

    const deletedProfile = await this.repo.deleteById(id);

    // Log de Sistema
    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Perfil",
      detalhes: `O perfil do funcionário '${existing.nome}' (ID: ${id}) foi removido.`,
    });

    return deletedProfile;
  }

  // ============================================================================
  // LEITURAS (GETTERS)
  // ============================================================================
  async getProfileById(id: string): Promise<UserProfile | null> {
    return this.repo.findById(id);
  }

  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    return this.repo.findByUserId(userId);
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
      return { data: [], total: 0, page, perPage, totalPages: 0 };
    }
    return this.repo.searchPaginated(cleanedTerm, page, perPage, lojaId);
  }
}
