// src/services/user.service.ts
import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/hash";
import { user as User } from "../generated/prisma/client";

export class UserService {
  private repo = new UserRepository();

  // Register / create user
  async createUser(email: string, senha: string, role = "USER"): Promise<User> {
    const existing = await this.repo.findByEmail(email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const senha_hash = await hashPassword(senha);
    return this.repo.create({ email, senha_hash, role });
  }

  // Hard delete user
  async deleteUser(user_id: string): Promise<User> {
    const existing = await this.repo.findById(user_id);
    if (!existing) throw new Error("User not found");
    return this.repo.deleteById(user_id);
  }

  // Update partial (patch-like)
  async updateUser(
    user_id: string,
    payload: Partial<{
      email: string;
      senha?: string;
      ativo: boolean;
      role: string;
    }>
  ): Promise<User> {
    const existing = await this.repo.findById(user_id);
    if (!existing) throw new Error("User not found");

    const data: any = {};
    if (payload.email) data.email = payload.email;
    if (typeof payload.ativo !== "undefined") data.ativo = payload.ativo;
    if (payload.role) data.role = payload.role;
    if (payload.senha) {
      data.senha_hash = await hashPassword(payload.senha);
    }

    return this.repo.updateById(user_id, data);
  }

  // Get by id
  async getUserById(user_id: string): Promise<User | null> {
    return this.repo.findById(user_id);
  }

  // Get by email
  async getUserByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email);
  }

  // Get all
  async getAllUsers(): Promise<User[]> {
    return this.repo.findAll();
  }

  // Paginated
  async getUsersPaginated(page = 1, perPage = 10) {
    return this.repo.findPaginated(page, perPage);
  }

  // Search paginated
  async searchUsers(term: string, page = 1, perPage = 10) {
    const cleanedTerm = term?.trim() ?? "";

    // Se o termo limpo estiver vazio → retorna vazio imediatamente
    if (cleanedTerm.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        perPage,
        totalPages: 0,
      };
    }

    // CORREÇÃO PRINCIPAL: Passamos 'cleanedTerm' para garantir que espaços extras
    // não quebrem a busca (ex: "example " virar "example")
    return this.repo.searchPaginated(cleanedTerm, page, perPage);
  }

  // Authenticate (login)
  async authenticate(email: string, senha: string) {
    const user = await this.repo.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    const match = await comparePassword(senha, (user as any).senha_hash);
    if (!match) throw new Error("Invalid credentials");

    return user;
  }
}
