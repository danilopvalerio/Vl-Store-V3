//src/repositories/user_profile.repository.ts
import { prisma } from "../database/prisma";
import {
  Prisma,
  user_profile as UserProfile,
} from "../generated/prisma/client";

export class UserProfileRepository {
  // Cria o perfil
  // SQL: INSERT INTO user_profile (user_id, id_loja, nome...) VALUES (...) RETURNING *;
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

  // Busca por ID (Primary Key)
  // SQL: SELECT * FROM user_profile WHERE id_user_profile = '...' LIMIT 1;
  async findById(id_user_profile: string): Promise<UserProfile | null> {
    return prisma.user_profile.findUnique({ where: { id_user_profile } });
  }

  // Busca por cpf_cnpj (Unique Constraint)
  // SQL: SELECT * FROM user_profile WHERE cpf_cnpj = '...' LIMIT 1;
  async findByCpfCnpj(cpf_cnpj: string): Promise<UserProfile | null> {
    return prisma.user_profile.findUnique({ where: { cpf_cnpj } });
  }

  // Busca por ID do Usuário
  // SQL: SELECT * FROM user_profile WHERE user_id = '...' LIMIT 1;
  async findByUserId(user_id: string): Promise<UserProfile | null> {
    return prisma.user_profile.findFirst({ where: { user_id } });
  }

  // Atualiza dados (usando Partial para flexibilidade)
  // SQL: UPDATE user_profile SET ... WHERE id_user_profile = '...';
  async updateById(
    id_user_profile: string,
    data: Partial<UserProfile>
  ): Promise<UserProfile> {
    return prisma.user_profile.update({ where: { id_user_profile }, data });
  }

  // Deleta
  // SQL: DELETE FROM user_profile WHERE id_user_profile = '...';
  async deleteById(id_user_profile: string): Promise<UserProfile> {
    return prisma.user_profile.delete({ where: { id_user_profile } });
  }

  // Lista todos
  // SQL: SELECT * FROM user_profile;
  async findAll(): Promise<UserProfile[]> {
    return prisma.user_profile.findMany();
  }

  async findPaginated(page: number, perPage: number, lojaId?: string) {
    const offset = (page - 1) * perPage;

    // Monta o filtro dinâmico
    const where: Prisma.user_profileWhereInput = {};
    if (lojaId) {
      where.id_loja = lojaId;
    }

    const total = await prisma.user_profile.count({ where });

    const data = await prisma.user_profile.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { nome: "asc" },
      // include: { user: true } // Opcional: se quiser trazer dados do login
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // --- BUSCA TEXTUAL COM FILTRO DE LOJA ---
  async searchPaginated(
    term: string,
    page: number,
    perPage: number,
    lojaId?: string
  ) {
    const offset = (page - 1) * perPage;

    // Filtro base: Termo de busca
    const searchCondition: Prisma.user_profileWhereInput = {
      OR: [
        { nome: { contains: term, mode: "insensitive" } },
        { cpf_cnpj: { contains: term, mode: "insensitive" } },
        { cargo: { contains: term, mode: "insensitive" } },
        { tipo_perfil: { contains: term, mode: "insensitive" } },
      ],
    };

    // Combina com o filtro de loja (se existir)
    const where: Prisma.user_profileWhereInput = lojaId
      ? { AND: [{ id_loja: lojaId }, searchCondition] }
      : searchCondition;

    const total = await prisma.user_profile.count({ where });

    const data = await prisma.user_profile.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { nome: "asc" },
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
