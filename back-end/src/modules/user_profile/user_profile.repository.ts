import { prisma } from "../../shared/database/prisma";
import {
  IUserProfileRepository,
  UserProfileEntity,
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
} from "./user_profile.dto";
import { RepositoryPaginatedResult } from "../../shared/dtos/index.dto";
import {
  Prisma,
  user_profile,
} from "../../shared/database/generated/prisma/client";

// DICA: 'user_profile' é a interface gerada pelo Prisma que representa a tabela.
// Não precisamos usar GetPayload se não estamos fazendo 'includes' (joins) complexos neste repositório.

export class UserProfileRepository implements IUserProfileRepository {
  // Mapper: Converte o tipo do Prisma (user_profile) para nossa Entidade (UserProfileEntity)
  // Como definimos a Entity espelhando o Prisma, o mapeamento é 1 para 1.
  private mapToEntity(profile: user_profile): UserProfileEntity {
    return {
      id_user_profile: profile.id_user_profile,
      user_id: profile.user_id,
      id_loja: profile.id_loja,
      nome: profile.nome,
      cpf_cnpj: profile.cpf_cnpj,
      cargo: profile.cargo,
      tipo_perfil: profile.tipo_perfil,
      ativo: profile.ativo,
      data_criacao: profile.data_criacao,
      ultima_atualizacao: profile.ultima_atualizacao,
    };
  }

  async create(data: CreateUserProfileDTO): Promise<UserProfileEntity> {
    const profile = await prisma.user_profile.create({
      data: {
        user_id: data.user_id,
        id_loja: data.id_loja,
        nome: data.nome,
        cpf_cnpj: data.cpf_cnpj,
        cargo: data.cargo,
        tipo_perfil: data.tipo_perfil,
      },
    });
    return this.mapToEntity(profile);
  }

  async update(
    id: string,
    data: UpdateUserProfileDTO
  ): Promise<UserProfileEntity> {
    const profile = await prisma.user_profile.update({
      where: { id_user_profile: id },
      data: {
        nome: data.nome,
        cpf_cnpj: data.cpf_cnpj,
        cargo: data.cargo,
        tipo_perfil: data.tipo_perfil,
        ativo: data.ativo,
        ultima_atualizacao: new Date(),
      },
    });
    return this.mapToEntity(profile);
  }

  async findById(id: string): Promise<UserProfileEntity | null> {
    const profile = await prisma.user_profile.findUnique({
      where: { id_user_profile: id },
    });
    return profile ? this.mapToEntity(profile) : null;
  }

  async findByCpfCnpj(
    cpf_cnpj: string,
    id_loja?: string
  ): Promise<UserProfileEntity | null> {
    const where: Prisma.user_profileWhereInput = { cpf_cnpj };
    if (id_loja) {
      where.id_loja = id_loja;
    }
    const profile = await prisma.user_profile.findFirst({ where });
    return profile ? this.mapToEntity(profile) : null;
  }

  async findByUserId(
    user_id: string,
    id_loja?: string
  ): Promise<UserProfileEntity | null> {
    const where: Prisma.user_profileWhereInput = { user_id };
    if (id_loja) {
      where.id_loja = id_loja;
    }
    const profile = await prisma.user_profile.findFirst({ where });
    return profile ? this.mapToEntity(profile) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.user_profile.delete({ where: { id_user_profile: id } });
  }

  async findAll(): Promise<UserProfileEntity[]> {
    const profiles = await prisma.user_profile.findMany();
    return profiles.map((p) => this.mapToEntity(p));
  }

  async findPaginated(
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<UserProfileEntity>> {
    return this.findPaginatedWithFilter(page, limit);
  }

  async findPaginatedWithFilter(
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<RepositoryPaginatedResult<UserProfileEntity>> {
    const skip = (page - 1) * limit;
    const where: Prisma.user_profileWhereInput = lojaId
      ? { id_loja: lojaId }
      : {};

    const [data, total] = await Promise.all([
      prisma.user_profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: "asc" },
      }),
      prisma.user_profile.count({ where }),
    ]);

    return { data: data.map((p) => this.mapToEntity(p)), total };
  }

  async searchPaginated(
    query: string,
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<UserProfileEntity>> {
    return this.searchPaginatedWithFilter(query, page, limit);
  }

  async searchPaginatedWithFilter(
    query: string,
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<RepositoryPaginatedResult<UserProfileEntity>> {
    const skip = (page - 1) * limit;

    const searchCondition: Prisma.user_profileWhereInput = {
      OR: [
        { nome: { contains: query, mode: "insensitive" } },
        { cpf_cnpj: { contains: query, mode: "insensitive" } },
        { cargo: { contains: query, mode: "insensitive" } },
        { tipo_perfil: { contains: query, mode: "insensitive" } },
      ],
    };

    const where: Prisma.user_profileWhereInput = lojaId
      ? { AND: [{ id_loja: lojaId }, searchCondition] }
      : searchCondition;

    const [data, total] = await Promise.all([
      prisma.user_profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: "asc" },
      }),
      prisma.user_profile.count({ where }),
    ]);

    return { data: data.map((p) => this.mapToEntity(p)), total };
  }
}
