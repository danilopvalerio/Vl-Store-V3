import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/hash";
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
} from "../dtos/user.dto";
import {
  user as User,
  telefone_user as TelefoneUser,
} from "../generated/prisma/client";

function toDTO(
  user: User & { telefone_user?: TelefoneUser[] }
): UserResponseDTO {
  const { senha_hash, ...rest } = user;
  return {
    ...rest,
    telefones: user.telefone_user?.map((t) => t.telefone) || [],
  };
}

export class UserService {
  private repo = new UserRepository();

  // --- CREATE ---
  async createUser(data: CreateUserDTO): Promise<UserResponseDTO> {
    // 1. Regra: Email único
    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new Error("O e-mail já está cadastrado");

    // Normaliza telefones para array vazio caso undefined/null
    const telefones = Array.isArray(data.telefones) ? data.telefones : [];

    if (telefones.length > 0) {
      // 2. Regra: Máximo 2 telefones
      if (telefones.length > 2) {
        throw new Error("Máximo 2 telefones permitidos");
      }

      // 3. Regra: Telefone único
      const phoneInUse = await this.repo.findPhoneInUse(telefones);
      if (phoneInUse) {
        throw new Error(`O telefone '${phoneInUse}' já está em uso`);
      }
    }

    const senha_hash = await hashPassword(data.senha);

    // 4. Cria o User
    const user = await this.repo.create({
      email: data.email,
      senha_hash,
    });

    // 5. Se tiver telefones, salva eles
    if (telefones.length > 0) {
      await this.repo.replacePhones(user.user_id, telefones);
    }

    const fullUser = await this.repo.findById(user.user_id);
    return toDTO(fullUser!);
  }

  // --- UPDATE ---
  async updateUser(
    user_id: string,
    data: UpdateUserDTO
  ): Promise<UserResponseDTO> {
    const existing = await this.repo.findById(user_id);
    if (!existing) throw new Error("Usuário não encontrado");

    if (data.telefones) {
      // Regra: Máximo 2 telefones
      if (data.telefones.length > 2) {
        throw new Error("Máximo 2 telefones permitidos");
      }

      // NOVA REGRA: Telefone único (com exceção para o próprio usuário)
      // Passamos o user_id atual para ignorar os números que já pertencem a ele
      const phoneInUse = await this.repo.findPhoneInUse(
        data.telefones,
        user_id
      );
      if (phoneInUse) {
        throw new Error(
          `O telefone '${phoneInUse}' já está em uso por outro usuário`
        );
      }
    }

    // Prepara dados do User
    const updateData: Partial<User> = {};
    if (data.email) updateData.email = data.email;
    if (typeof data.ativo !== "undefined") updateData.ativo = data.ativo;
    if (data.senha) updateData.senha_hash = await hashPassword(data.senha);

    // Atualiza tabela User
    await this.repo.updateById(user_id, updateData);

    // Atualiza tabela Telefones (se o campo foi enviado)
    if (data.telefones) {
      await this.repo.replacePhones(user_id, data.telefones);
    }

    const updated = await this.repo.findById(user_id);
    return toDTO(updated!);
  }

  // ... (Demais métodos delete, getters, etc continuam iguais)
  async deleteUser(user_id: string): Promise<void> {
    const existing = await this.repo.findById(user_id);
    if (!existing) throw new Error("Usuário não encontrado");
    await this.repo.deleteById(user_id);
  }

  async getUserById(user_id: string): Promise<UserResponseDTO | null> {
    const user = await this.repo.findById(user_id);
    return user ? toDTO(user) : null;
  }

  async getUserByEmail(email: string): Promise<UserResponseDTO | null> {
    const user = await this.repo.findByEmail(email);
    return user ? toDTO(user) : null;
  }

  async getAllUsers(): Promise<UserResponseDTO[]> {
    const users = await this.repo.findAll();
    return users.map(toDTO);
  }

  async authenticate(email: string, senha: string): Promise<UserResponseDTO> {
    const user = await this.repo.findByEmail(email);
    if (!user) throw new Error("Credenciais inválidas");

    const match = await comparePassword(senha, user.senha_hash);
    if (!match) throw new Error("Credenciais inválidas");

    return toDTO(user);
  }

  async getUsersPaginated(page = 1, perPage = 10, lojaId?: string) {
    const result = await this.repo.findPaginated(page, perPage, lojaId);
    return {
      ...result,
      data: result.data.map(toDTO),
    };
  }

  // Adicionado parâmetro lojaId
  async searchUsers(term: string, page = 1, perPage = 10, lojaId?: string) {
    const cleanedTerm = term?.trim() ?? "";
    if (cleanedTerm.length === 0) {
      return { data: [], total: 0, page, perPage, totalPages: 0 };
    }

    const result = await this.repo.searchPaginated(
      cleanedTerm,
      page,
      perPage,
      lojaId
    );
    return {
      ...result,
      data: result.data.map(toDTO),
    };
  }
}
