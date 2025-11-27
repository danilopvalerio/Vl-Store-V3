//src/services/user_profile.service.ts
import { UserProfileRepository } from "../repositories/user_profile.repository";
import { user_profile as UserProfile } from "../generated/prisma/client";
import {
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
} from "../dtos/user_profile.dto";

export class UserProfileService {
  private repo = new UserProfileRepository();

  // Recebe DTO, valida duplicidade de cpf_cnpj e cria
  async createProfile(data: CreateUserProfileDTO): Promise<UserProfile> {
    // Validação: cpf_cnpj único

    const userHasProfile = await this.repo.findByUserId(data.user_id);
    if (userHasProfile) {
      throw new Error("Usuário já possui um perfil cadastrado");
    }

    if (data.cpf_cnpj) {
      const existing = await this.repo.findByCpfCnpj(data.cpf_cnpj);
      if (existing) {
        throw new Error("O CPF/CNPJ já está cadastrado");
      }
    }

    return this.repo.create({
      user_id: data.user_id,
      id_loja: data.id_loja,
      nome: data.nome,
      cpf_cnpj: data.cpf_cnpj,
      cargo: data.cargo,
      tipo_perfil: data.tipo_perfil,
    });
  }

  // Atualiza apenas os campos enviados no DTO
  async updateProfile(
    id: string,
    data: UpdateUserProfileDTO
  ): Promise<UserProfile> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error("Perfil não encontrado");

    // Validação: Se trocou o cpf_cnpj, verifica se o novo já existe
    if (data.cpf_cnpj && data.cpf_cnpj !== existing.cpf_cnpj) {
      const docExists = await this.repo.findByCpfCnpj(data.cpf_cnpj);
      if (docExists) throw new Error("O CPF/CNPJ já está cadastrado");
    }

    // Monta objeto parcial apenas com campos preenchidos
    const updateData: Partial<UserProfile> = {};

    if (data.nome) updateData.nome = data.nome;
    if (data.cpf_cnpj) updateData.cpf_cnpj = data.cpf_cnpj;
    if (data.cargo) updateData.cargo = data.cargo;
    if (data.tipo_perfil) updateData.tipo_perfil = data.tipo_perfil;

    // Verifica undefined para permitir valor booleano 'false'
    if (typeof data.ativo !== "undefined") {
      updateData.ativo = data.ativo;
    }

    return this.repo.updateById(id, updateData);
  }

  async deleteProfile(id: string): Promise<UserProfile> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error("Perfil não encontrado");

    return this.repo.deleteById(id);
  }

  async getProfileById(id: string): Promise<UserProfile | null> {
    return this.repo.findById(id);
  }

  async getAllProfiles(): Promise<UserProfile[]> {
    return this.repo.findAll();
  }

  async getProfilesPaginated(page = 1, perPage = 10, lojaId?: string) {
    return this.repo.findPaginated(page, perPage, lojaId);
  }

  // Repassa lojaId opcional
  async searchProfiles(term: string, page = 1, perPage = 10, lojaId?: string) {
    const cleanedTerm = term?.trim() ?? "";

    if (cleanedTerm.length === 0) {
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
