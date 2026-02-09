import path from "path";
import fs from "fs";
import {
  IUserProfileRepository,
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
  UserProfileEntity,
} from "./user_profile.dto";
import { AppError } from "../../app/middleware/error.middleware";
import { LogService } from "../logs/log.service";
import { deleteProfilePhoto } from "../../app/middleware/upload.middleware";
// VALIDATION IMPORTS REMOVIDOS (isValidUUID, isValidString) -> Zod cuida disso

export class UserProfileService {
  constructor(
    private repo: IUserProfileRepository,
    private logService: LogService,
  ) {}

  async getProfileAvatarPath(
    profileId: string,
    requestingUserId: string, // ID de quem está pedindo (token)
    requestingUserRole?: string,
  ): Promise<string> {
    const profile = await this.repo.findById(profileId);

    if (!profile) {
      throw new AppError("Perfil não encontrado.", 404);
    }

    if (!profile.foto_url) {
      throw new AppError("Este perfil não possui foto.", 404);
    }

    // --- Validação de Segurança (Arquivo Privado) ---
    // Apenas o dono do perfil ou Admin/Gerente pode ver a foto
    const isOwner = profile.user_id === requestingUserId;
    const isAdmin = ["SUPER_ADMIN", "ADMIN", "GERENTE"].includes(
      requestingUserRole || "",
    );

    if (!isOwner && !isAdmin) {
      // Se quiser ser muito estrito, lance 403.
      // Se quiser esconder a existência, lance 404.
      throw new AppError("Acesso negado à imagem.", 403);
    }

    // Constrói o caminho.
    // A foto_url agora tem o formato "uploads/perfis/arquivo.jpeg"
    // Então o caminho base é a raiz do projeto
    const projectRoot = path.resolve(__dirname, "..", "..", "..");
    const filePath = path.join(projectRoot, profile.foto_url);

    // Evitar Path Traversal (segurança)
    const uploadsFolder = path.join(projectRoot, "uploads");
    if (!filePath.startsWith(uploadsFolder)) {
      throw new AppError("Caminho de arquivo inválido.", 400);
    }

    if (!fs.existsSync(filePath)) {
      throw new AppError("Arquivo de imagem não encontrado no disco.", 404);
    }

    return filePath;
  }

  async createProfile(data: CreateUserProfileDTO): Promise<UserProfileEntity> {
    // 1. Verifica duplicidade de perfil (REGRA DE NEGÓCIO)
    const userHasProfile = await this.repo.findByUserId(
      data.user_id,
      data.id_loja,
    );

    if (userHasProfile) {
      throw new AppError(
        "Este usuário já possui um perfil cadastrado nesta loja.",
        409,
      );
    }

    // 2. Verifica duplicidade de CPF (REGRA DE NEGÓCIO)
    if (data.cpf_cnpj) {
      const existing = await this.repo.findByCpfCnpj(
        data.cpf_cnpj,
        data.id_loja,
      );
      if (existing) {
        throw new AppError("Este CPF/CNPJ já está cadastrado nesta loja.", 409);
      }
    }

    // 3. Regra de Negócio de Permissão
    if (data.tipo_perfil === "SUPER_ADMIN") {
      throw new AppError(
        "Criação de perfis SUPER_ADMIN não permitida por esta rota.",
        403,
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
    data: UpdateUserProfileDTO,
  ): Promise<UserProfileEntity> {
    // A validação de ID UUID já foi feita no middleware/Zod

    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Perfil não encontrado.", 404);

    // Validação de CPF duplicado na mesma loja
    if (data.cpf_cnpj && data.cpf_cnpj !== existing.cpf_cnpj) {
      const docExists = await this.repo.findByCpfCnpj(
        data.cpf_cnpj,
        existing.id_loja,
      );
      if (docExists && docExists.id_user_profile !== id) {
        throw new AppError(
          "Este CPF/CNPJ já está cadastrado para outro usuário nesta loja.",
          409,
        );
      }
    }

    if (data.tipo_perfil === "SUPER_ADMIN") {
      throw new AppError(
        "Alteração manual para SUPER_ADMIN não permitida.",
        403,
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
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Perfil não encontrado.", 404);

    // Se tiver foto, delete do disco usando o helper
    if (existing.foto_url) {
      await deleteProfilePhoto(existing.foto_url);
    }

    await this.repo.delete(id);
    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Perfil",
      detalhes: `Perfil ${id} removido.`,
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
    lojaId?: string,
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
      lojaId,
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
      lojaId,
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // ============================================================================
  // MÉTODOS DE FOTO DE PERFIL
  // ============================================================================

  async updateProfilePhoto(
    profileId: string,
    newFotoUrl: string,
    actorUserId: string,
  ): Promise<UserProfileEntity> {
    const existing = await this.repo.findById(profileId);
    if (!existing) throw new AppError("Perfil não encontrado.", 404);

    // Se já tinha foto, deleta a antiga
    if (existing.foto_url) {
      await deleteProfilePhoto(existing.foto_url);
    }

    const updatedProfile = await this.repo.update(profileId, {
      foto_url: newFotoUrl,
    });

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Atualizar Foto Perfil",
      detalhes: `Foto do perfil ${existing.nome} (ID: ${profileId}) atualizada.`,
    });

    return updatedProfile;
  }

  async deleteProfilePhoto(
    profileId: string,
    actorUserId: string,
  ): Promise<void> {
    const existing = await this.repo.findById(profileId);
    if (!existing) throw new AppError("Perfil não encontrado.", 404);

    if (!existing.foto_url) {
      throw new AppError("Este perfil não possui foto.", 404);
    }

    // Deleta os arquivos físicos
    await deleteProfilePhoto(existing.foto_url);

    // Atualiza o registro no banco removendo a foto_url
    await this.repo.update(profileId, { foto_url: undefined });

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Foto Perfil",
      detalhes: `Foto do perfil ${existing.nome} (ID: ${profileId}) removida.`,
    });
  }
}
