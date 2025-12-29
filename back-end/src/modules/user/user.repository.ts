import { prisma } from "../../shared/database/prisma";
import { Prisma, user } from "../../shared/database/generated/prisma/client";
import {
  IUserRepository,
  UserEntity,
  UserResponseDTO,
  CreateUserDTO,
  UpdateUserDTO,
} from "./user.dto";
import { hashPassword } from "../../shared/utils/hash";

// Tipo auxiliar para retorno do Prisma com Include
type UserWithPhones = Prisma.userGetPayload<{
  include: { telefone_user: true };
}>;

export class UserRepository implements IUserRepository {
  // Mapper Interno: Converte Prisma -> Entidade Completa (Com Senha)
  private mapToEntity(u: UserWithPhones | user): UserEntity {
    const entity: UserEntity = {
      user_id: u.user_id,
      email: u.email,
      senha_hash: u.senha_hash,
      ativo: u.ativo,
      data_criacao: u.data_criacao,
      ultima_atualizacao: u.ultima_atualizacao,
      telefones: [],
    };

    // Se vier telefones do banco, mapeia para array de strings
    if ("telefone_user" in u) {
      entity.telefones = u.telefone_user.map((t) => t.telefone);
    }

    return entity;
  }

  // Mapper Seguro: Converte Prisma -> ResponseDTO (Sem Senha)
  private mapToResponse(u: UserWithPhones | user): UserResponseDTO {
    let phones: string[] = [];
    if ("telefone_user" in u) {
      phones = u.telefone_user.map((t) => t.telefone);
    }

    return {
      id: u.user_id,
      email: u.email,
      ativo: u.ativo,
      criadoEm: u.data_criacao,
      telefones: phones,
    };
  }

  // ==========================================================================
  // AUTH
  // ==========================================================================
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { telefone_user: true }, // Importante para Auth retornar telefones no login
    });
    return user ? this.mapToEntity(user) : null;
  }

  // ==========================================================================
  // CRUD
  // ==========================================================================

  async create(data: CreateUserDTO): Promise<UserEntity> {
    const senhaHash = data.senha ? await hashPassword(data.senha) : "temp_hash";

    // USA TRANSACTION PARA GARANTIR INTEGRIDADE
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Cria o User
      const user = await tx.user.create({
        data: {
          email: data.email,
          senha_hash: senhaHash,
          ativo: true,
          telefone_user: {
            create: data.telefones?.map((tel) => ({ telefone: tel })),
          },
        },
        include: { telefone_user: true },
      });

      // 2. Cria o Profile usando o ID do usuário recém-criado
      await tx.user_profile.create({
        data: {
          user_id: user.user_id,
          id_loja: data.id_loja,
          nome: data.nome,
          cpf_cnpj: data.cpf_cnpj,
          cargo: data.cargo,
          tipo_perfil: data.tipo_perfil,
        },
      });

      return user;
    });

    return this.mapToEntity(newUser);
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserEntity> {
    const updateData: Prisma.userUpdateInput = {};

    if (data.email) updateData.email = data.email;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    if (data.senha) updateData.senha_hash = await hashPassword(data.senha);

    // Atualização de Telefones (Delete All + Create New - Estratégia simples)
    if (data.telefones) {
      updateData.telefone_user = {
        deleteMany: {}, // Limpa antigos
        create: data.telefones.map((tel) => ({ telefone: tel })), // Insere novos
      };
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: id },
      data: updateData,
      include: { telefone_user: true }, // Retorna atualizado
    });

    return this.mapToEntity(updatedUser);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.update({
      where: { user_id: id },
      data: { ativo: false },
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { user_id: id },
      include: { telefone_user: true },
    });
    return user ? this.mapToEntity(user) : null;
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await prisma.user.findMany({
      include: { telefone_user: true },
    });
    return users.map((u) => this.mapToEntity(u));
  }

  // ==========================================================================
  // LISTAGENS SEGURAS
  // ==========================================================================

  // Implementação genérica (retorna Entity)
  async findPaginated(
    page: number,
    limit: number
  ): Promise<{ data: UserEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: { telefone_user: true },
      }),
      prisma.user.count(),
    ]);
    return { data: users.map((u) => this.mapToEntity(u)), total };
  }

  async searchPaginated(
    query: string,
    page: number,
    limit: number
  ): Promise<{ data: UserEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = { email: { contains: query, mode: "insensitive" as const } };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { telefone_user: true },
      }),
      prisma.user.count({ where }),
    ]);
    return { data: users.map((u) => this.mapToEntity(u)), total };
  }

  // Implementação Segura (retorna ResponseDTO)
  async findPaginatedSafe(
    page: number,
    limit: number
  ): Promise<{ data: UserResponseDTO[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { data_criacao: "desc" },
        include: { telefone_user: true },
      }),
      prisma.user.count(),
    ]);
    return { data: users.map((u) => this.mapToResponse(u)), total };
  }

  async searchPaginatedSafe(
    query: string,
    page: number,
    limit: number
  ): Promise<{ data: UserResponseDTO[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.userWhereInput = {
      email: { contains: query, mode: "insensitive" },
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { email: "asc" },
        include: { telefone_user: true },
      }),
      prisma.user.count({ where }),
    ]);
    return { data: users.map((u) => this.mapToResponse(u)), total };
  }
}
