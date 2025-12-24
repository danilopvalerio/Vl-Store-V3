import {
  IUserRepository,
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
  UserEntity,
} from "./user.dto";
import { AppError } from "../../app/middleware/error.middleware";
import { LogService } from "../logs/log.service";
// Validações manuais (isValidEmail) removidas, o Zod já garantiu.

export class UserService {
  constructor(private repo: IUserRepository, private logService: LogService) {}

  // Helper para converter Entity -> ResponseDTO
  private toResponse(entity: UserEntity): UserResponseDTO {
    return {
      id: entity.user_id,
      email: entity.email,
      ativo: entity.ativo,
      criadoEm: entity.data_criacao,
      telefones: entity.telefones || [],
    };
  }

  async createUser(
    data: CreateUserDTO,
    actorUserId: string
  ): Promise<UserResponseDTO> {
    // Validação de formato de e-mail removida (Zod fez)

    // Regra de Negócio: Unicidade
    const exists = await this.repo.findByEmail(data.email);
    if (exists) throw new AppError("Email já cadastrado.", 409);

    const newUser = await this.repo.create(data);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Criar Usuário",
      detalhes: `Usuário ${newUser.email} criado.`,
    });

    return this.toResponse(newUser);
  }

  async updateUser(
    id: string,
    data: UpdateUserDTO,
    actorUserId: string
  ): Promise<UserResponseDTO> {
    // Validação de ID UUID removida (Zod fez)

    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Usuário não encontrado.", 404);

    const updated = await this.repo.update(id, data);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Atualizar Usuário",
      detalhes: `Usuário ${id} atualizado.`,
    });

    return this.toResponse(updated);
  }

  async deleteUser(id: string, actorUserId: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Usuário não encontrado.", 404);

    await this.repo.delete(id);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Usuário",
      detalhes: `Usuário ${id} desativado.`,
    });
  }

  async getUserById(id: string): Promise<UserResponseDTO> {
    const user = await this.repo.findById(id);
    if (!user) throw new AppError("Usuário não encontrado.", 404);
    return this.toResponse(user);
  }

  async listPaginated(page: number, limit: number) {
    // page e limit já garantidos como number pelo Zod (z.coerce.number)
    const result = await this.repo.findPaginatedSafe(page, limit);
    return { ...result, page, lastPage: Math.ceil(result.total / limit) };
  }

  async searchPaginated(term: string, page: number, limit: number) {
    const result = await this.repo.searchPaginatedSafe(term, page, limit);
    return { ...result, page, lastPage: Math.ceil(result.total / limit) };
  }
}
