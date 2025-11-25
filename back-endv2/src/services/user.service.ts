import { UserRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/hash";
import { user as User } from "../generated/prisma/client";
import { CreateUserDTO, UpdateUserDTO } from "../dtos/user.dto";

export class UserService {
  private repo = new UserRepository();

  // --- CREATE ---
  // Recebe o DTO (dados limpos do front) e retorna o Usuário criado
  async createUser(data: CreateUserDTO): Promise<User> {
    // 1. Regra de Negócio: Não pode ter dois e-mails iguais
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    // 2. Segurança: NUNCA salvar senha em texto puro. Criptografamos antes.
    const senha_hash = await hashPassword(data.senha);

    // 3. Define valor padrão se não vier nada
    const role = data.role || "USER";

    // 4. Chama o repo para salvar
    return this.repo.create({
      email: data.email,
      senha_hash,
      role,
    });
  }

  // --- UPDATE ---
  async updateUser(user_id: string, data: UpdateUserDTO): Promise<User> {
    // 1. Verifica se o usuário existe antes de tentar atualizar
    const existing = await this.repo.findById(user_id);
    if (!existing) throw new Error("User not found");

    // 2. Montamos um objeto só com o que veio para atualizar.
    // 'Partial<User>' diz pro TypeScript: "Isso é um pedaço de um User"
    const updateData: Partial<User> = {};

    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;

    // ATENÇÃO: Booleanos precisam de cuidado.
    // Se fizermos "if (data.ativo)", e vier 'false', ele não entra no if!
    // Por isso checamos se é diferente de "undefined".
    if (typeof data.ativo !== "undefined") {
      updateData.ativo = data.ativo;
    }

    // Se o usuário mandou senha nova, a gente hasheia ela de novo.
    if (data.senha) {
      updateData.senha_hash = await hashPassword(data.senha);
    }

    // 3. Manda pro banco só os campos alterados
    return this.repo.updateById(user_id, updateData);
  }

  // --- DELETE ---
  async deleteUser(user_id: string): Promise<User> {
    // Regra: Só deleta se existir.
    const existing = await this.repo.findById(user_id);
    if (!existing) throw new Error("User not found");

    return this.repo.deleteById(user_id);
  }

  // --- GETTERS & AUTH (Leituras) ---

  async getUserById(user_id: string): Promise<User | null> {
    return this.repo.findById(user_id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email);
  }

  async getAllUsers(): Promise<User[]> {
    return this.repo.findAll();
  }

  // Lógica de Login
  async authenticate(email: string, senha: string): Promise<User> {
    // 1. Acha o usuário pelo email
    const user = await this.repo.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    // 2. Compara a senha digitada com o hash do banco
    const match = await comparePassword(senha, user.senha_hash);
    if (!match) throw new Error("Invalid credentials");

    return user;
  }

  // --- PAGINATION ---
  // Apenas repassa para o repositório, mas poderíamos ter regras aqui
  // (ex: limitar maximo de perPage a 100)
  async getUsersPaginated(page = 1, perPage = 10) {
    return this.repo.findPaginated(page, perPage);
  }

  async searchUsers(term: string, page = 1, perPage = 10) {
    // Limpeza básica: remove espaços em branco antes e depois
    const cleanedTerm = term?.trim() ?? "";

    if (cleanedTerm.length === 0) {
      // Se o termo for vazio, retorna lista vazia para não pesar o banco
      return {
        data: [],
        total: 0,
        page,
        perPage,
        totalPages: 0,
      };
    }
    return this.repo.searchPaginated(cleanedTerm, page, perPage);
  }
}
