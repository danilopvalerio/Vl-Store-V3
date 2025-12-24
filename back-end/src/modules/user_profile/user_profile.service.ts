import {
  IUserProfileRepository,
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
  UserProfileEntity,
} from "./user_profile.dto";
import { AppError } from "../../app/middleware/error.middleware";
import { LogService } from "../logs/log.service";
// VALIDATION IMPORTS REMOVIDOS (isValidUUID, isValidString) -> Zod cuida disso

export class UserProfileService {
  constructor(
    private repo: IUserProfileRepository,
    private logService: LogService
  ) {}

  async createProfile(data: CreateUserProfileDTO): Promise<UserProfileEntity> {
    // 1. Verifica duplicidade de perfil (REGRA DE NEGÓCIO)
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

    // 2. Verifica duplicidade de CPF (REGRA DE NEGÓCIO)
    if (data.cpf_cnpj) {
      const existing = await this.repo.findByCpfCnpj(
        data.cpf_cnpj,
        data.id_loja
      );
      if (existing) {
        throw new AppError("Este CPF/CNPJ já está cadastrado nesta loja.", 409);
      }
    }

    // 3. Regra de Negócio de Permissão
    if (data.tipo_perfil === "SUPER_ADMIN") {
      throw new AppError(
        "Criação de perfis SUPER_ADMIN não permitida por esta rota.",
        403
      );
    }

    const newProfile = await this.repo.create(data);

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Criar Perfil",
      detalhes: `Perfil criado para '${data.nome}'. Loja ID: ${data.id_loja}. Cargo: ${data.cargo}.`,
    });

    return newProfile;
  }

  async updateProfile(
    id: string,
    data: UpdateUserProfileDTO
  ): Promise<UserProfileEntity> {
    // A validação de ID UUID já foi feita no middleware/Zod

    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Perfil não encontrado.", 404);

    // Validação de CPF duplicado na mesma loja
    if (data.cpf_cnpj && data.cpf_cnpj !== existing.cpf_cnpj) {
      const docExists = await this.repo.findByCpfCnpj(
        data.cpf_cnpj,
        existing.id_loja
      );
      if (docExists && docExists.id_user_profile !== id) {
        throw new AppError(
          "Este CPF/CNPJ já está cadastrado para outro usuário nesta loja.",
          409
        );
      }
    }

    if (data.tipo_perfil === "SUPER_ADMIN") {
      throw new AppError(
        "Alteração manual para SUPER_ADMIN não permitida.",
        403
      );
    }

    const updatedProfile = await this.repo.update(id, data);

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Atualizar Perfil",
      detalhes: `Perfil de ${existing.nome} (ID: ${id}) alterado.`,
    });

    return updatedProfile;
  }

  async deleteProfile(id: string, actorUserId?: string): Promise<void> {
    // Validação de ID UUID feita pelo Zod
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Perfil não encontrado.", 404);

    await this.repo.delete(id);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Perfil",
      detalhes: `O perfil do funcionário '${existing.nome}' (ID: ${id}) foi removido.`,
    });
  }

  async getProfileById(id: string): Promise<UserProfileEntity> {
    // Validação de ID UUID feita pelo Zod
    const profile = await this.repo.findById(id);
    if (!profile) throw new AppError("Perfil não encontrado", 404);
    return profile;
  }

  async getProfileByUserId(
    userId: string,
    lojaId?: string
  ): Promise<UserProfileEntity> {
    // Validação de userId UUID feita pelo Zod
    const profile = await this.repo.findByUserId(userId, lojaId);
    if (!profile)
      throw new AppError("Perfil não encontrado para este usuário.", 404);
    return profile;
  }

  async getAllProfiles(): Promise<UserProfileEntity[]> {
    return this.repo.findAll();
  }

  async getProfilesPaginated({
    page,
    limit,
    lojaId,
  }: {
    page: number;
    limit: number;
    lojaId?: string;
  }) {
    if (page <= 0 || limit <= 0)
      throw new AppError("Parâmetros de paginação inválidos"); // Isso aqui também poderia ir pro Zod se fosse via query params

    const { data, total } = await this.repo.findPaginatedWithFilter(
      page,
      limit,
      lojaId
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async searchProfiles({
    query,
    page,
    limit,
    lojaId,
  }: {
    query: string;
    page: number;
    limit: number;
    lojaId?: string;
  }) {
    if (!query) throw new AppError("O parâmetro 'term' é obrigatório");

    const { data, total } = await this.repo.searchPaginatedWithFilter(
      query,
      page,
      limit,
      lojaId
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }
}
