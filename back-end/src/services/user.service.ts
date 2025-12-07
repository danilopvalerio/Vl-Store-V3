import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/hash";
import { LogService } from "./log.service"; // Importando serviço de log
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
} from "../dtos/user.dto";
import {
  user as User,
  telefone_user as TelefoneUser,
} from "../generated/prisma/client";

// Helper para remover a senha do objeto de retorno
function toDTO(
  user: User & { telefone_user?: TelefoneUser[] }
): UserResponseDTO {
  const { senha_hash, ...rest } = user;
  void senha_hash;
  return {
    ...rest,
    telefones: user.telefone_user?.map((t) => t.telefone) || [],
  };
}

export class UserService {
  private repo = new UserRepository();
  private logService = new LogService();

  // ============================================================================
  // CREATE USER
  // ============================================================================
  async createUser(
    data: CreateUserDTO,
    actorUserId?: string
  ): Promise<UserResponseDTO> {
    // 1. Validações
    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new Error("O e-mail já está cadastrado.");

    const telefones = Array.isArray(data.telefones) ? data.telefones : [];

    if (telefones.length > 0) {
      if (telefones.length > 2)
        throw new Error("Máximo 2 telefones permitidos.");
      const phoneInUse = await this.repo.findPhoneInUse(telefones);
      if (phoneInUse)
        throw new Error(`O telefone '${phoneInUse}' já está em uso.`);
    }

    const senha_hash = await hashPassword(data.senha);

    // 2. Criação
    const user = await this.repo.create({
      email: data.email,
      senha_hash,
    });

    if (telefones.length > 0) {
      await this.repo.replacePhones(user.user_id, telefones);
    }

    // 3. Log de Sistema (Criação)
    await this.logService.logSystem({
      id_user: actorUserId || user.user_id, // Se for auto-cadastro, usa o próprio ID
      acao: "Criar Usuário",
      detalhes: `Nova conta de acesso criada para o e-mail: ${user.email}.`,
    });

    const fullUser = await this.repo.findById(user.user_id);
    return toDTO(fullUser!);
  }

  // ============================================================================
  // UPDATE USER (Com Detalhamento de Mudanças)
  // ============================================================================
  async updateUser(
    user_id: string,
    data: UpdateUserDTO,
    actorUserId: string
  ): Promise<UserResponseDTO> {
    const existing = await this.repo.findById(user_id);
    if (!existing) throw new Error("Usuário não encontrado.");

    // 1. Validação de Telefones
    if (data.telefones) {
      if (data.telefones.length > 2)
        throw new Error("Máximo 2 telefones permitidos.");
      const phoneInUse = await this.repo.findPhoneInUse(
        data.telefones,
        user_id
      );
      if (phoneInUse)
        throw new Error(`O telefone '${phoneInUse}' já está em uso.`);
    }

    // 2. Preparação do Update e Detecção de Mudanças
    const updateData: Partial<User> = {};
    const mudancas: string[] = []; // Array para guardar as frases do log

    // Verifica Email
    if (data.email && data.email !== existing.email) {
      updateData.email = data.email;
      mudancas.push(
        `E-mail alterado de '${existing.email}' para '${data.email}'`
      );
    }

    // Verifica Status (Ativo/Inativo)
    if (typeof data.ativo !== "undefined" && data.ativo !== existing.ativo) {
      updateData.ativo = data.ativo;
      mudancas.push(
        `Status da conta alterado para ${data.ativo ? "Ativo" : "Inativo"}`
      );
    }

    // Verifica Senha (sem logar o hash)
    if (data.senha) {
      updateData.senha_hash = await hashPassword(data.senha);
      mudancas.push(`Senha de acesso redefinida`);
    }

    // Verifica Telefones (Simplificado)
    if (data.telefones) {
      // Aqui sempre atualiza se vier o array, então assumimos mudança
      await this.repo.replacePhones(user_id, data.telefones);
      const telsAntigos = existing.telefone_user
        .map((t) => t.telefone)
        .join(", ");
      const telsNovos = data.telefones.join(", ");
      if (telsAntigos !== telsNovos) {
        mudancas.push(
          `Telefones alterados de [${telsAntigos}] para [${telsNovos}]`
        );
      }
    }

    // 3. Executa Update no Banco (se houver dados)
    if (Object.keys(updateData).length > 0) {
      await this.repo.updateById(user_id, updateData);
    }

    // 4. Log de Sistema (Apenas se houve mudanças reais)
    if (mudancas.length > 0) {
      await this.logService.logSystem({
        id_user: actorUserId,
        acao: "Atualizar Usuário",
        detalhes: `Conta ID ${user_id} (${
          existing.email
        }). Mudanças: ${mudancas.join(". ")}.`,
      });
    }

    const updated = await this.repo.findById(user_id);
    return toDTO(updated!);
  }

  // ============================================================================
  // DELETE USER
  // ============================================================================
  async deleteUser(user_id: string, actorUserId: string): Promise<void> {
    const existing = await this.repo.findById(user_id);
    if (!existing) throw new Error("Usuário não encontrado.");

    await this.repo.deleteById(user_id);

    // Log de Sistema
    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Usuário",
      detalhes: `A conta de acesso ${existing.email} (ID: ${user_id}) foi excluída permanentemente do sistema.`,
    });
  }

  // ============================================================================
  // MÉTODOS DE LEITURA (Auth e Getters) - Sem logs de sistema
  // ============================================================================
  async authenticate(email: string, senha: string): Promise<UserResponseDTO> {
    const user = await this.repo.findByEmail(email);
    if (!user) throw new Error("Credenciais inválidas");
    const match = await comparePassword(senha, user.senha_hash);
    if (!match) throw new Error("Credenciais inválidas");
    return toDTO(user);
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

  async getUsersPaginated(page = 1, perPage = 10, lojaId?: string) {
    const result = await this.repo.findPaginated(page, perPage, lojaId);
    return { ...result, data: result.data.map(toDTO) };
  }

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
    return { ...result, data: result.data.map(toDTO) };
  }
}
