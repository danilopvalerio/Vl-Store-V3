import { prisma } from "../database/prisma";
import {
  Prisma,
  user_profile as UserProfile,
} from "../generated/prisma/client";

export class UserProfileRepository {
  async create(data: {
    user_id: string;
    id_loja: string;
    nome: string;
    cpf_cnpj?: string;
    cargo?: string;
    tipo_perfil?: string;
  }): Promise<UserProfile> {
    return prisma.user_profile.create({ data });
  }

  // Busca por ID (PK continua sendo único globalmente)
  async findById(id_user_profile: string): Promise<UserProfile | null> {
    return prisma.user_profile.findUnique({ where: { id_user_profile } });
  }

  // CORREÇÃO 1: Busca por CPF agora exige o ID da Loja e usa findFirst
  // "Existe esse CPF dentro desta loja?"
  async findByCpfCnpj(
    cpf_cnpj: string,
    id_loja?: string
  ): Promise<UserProfile | null> {
    const where: Prisma.user_profileWhereInput = { cpf_cnpj };

    // Se passar a loja, filtra por ela. Se não passar, busca o primeiro que achar (cuidado)
    if (id_loja) {
      where.id_loja = id_loja;
    }

    return prisma.user_profile.findFirst({ where });
  }

  // CORREÇÃO 2: Busca perfil do usuário (considerando a loja se fornecida)
  async findByUserId(
    user_id: string,
    id_loja?: string
  ): Promise<UserProfile | null> {
    const where: Prisma.user_profileWhereInput = { user_id };

    if (id_loja) {
      where.id_loja = id_loja;
    }

    return prisma.user_profile.findFirst({ where });
  }

  async updateById(
    id_user_profile: string,
    data: Partial<UserProfile>
  ): Promise<UserProfile> {
    return prisma.user_profile.update({ where: { id_user_profile }, data });
  }

  async deleteById(id_user_profile: string): Promise<UserProfile> {
    return prisma.user_profile.delete({ where: { id_user_profile } });
  }

  async findAll(): Promise<UserProfile[]> {
    return prisma.user_profile.findMany();
  }

  async findPaginated(page: number, perPage: number, lojaId?: string) {
    const offset = (page - 1) * perPage;
    const where: Prisma.user_profileWhereInput = lojaId
      ? { id_loja: lojaId }
      : {};

    const [total, data] = await Promise.all([
      prisma.user_profile.count({ where }),
      prisma.user_profile.findMany({
        where,
        take: perPage,
        skip: offset,
        orderBy: { nome: "asc" },
      }),
    ]);

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async searchPaginated(
    term: string,
    page: number,
    perPage: number,
    lojaId?: string
  ) {
    const offset = (page - 1) * perPage;

    const searchCondition: Prisma.user_profileWhereInput = {
      OR: [
        { nome: { contains: term, mode: "insensitive" } },
        { cpf_cnpj: { contains: term, mode: "insensitive" } },
        { cargo: { contains: term, mode: "insensitive" } },
        { tipo_perfil: { contains: term, mode: "insensitive" } },
      ],
    };

    const where: Prisma.user_profileWhereInput = lojaId
      ? { AND: [{ id_loja: lojaId }, searchCondition] }
      : searchCondition;

    const [total, data] = await Promise.all([
      prisma.user_profile.count({ where }),
      prisma.user_profile.findMany({
        where,
        take: perPage,
        skip: offset,
        orderBy: { nome: "asc" },
      }),
    ]);

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
