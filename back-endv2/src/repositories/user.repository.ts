import { prisma } from "../database/prisma";
import {
  user as User,
  telefone_user as TelefoneUser,
  Prisma,
} from "../generated/prisma/client";

// Tipo auxiliar interno para quando o Prisma retorna User + Telefones
type UserWithPhones = User & { telefone_user: TelefoneUser[] };

export class UserRepository {
  // Cria o usuário (Telefones são inseridos depois via Service ou Transaction externa)
  async create(data: { email: string; senha_hash: string }): Promise<User> {
    return prisma.user.create({ data });
  }

  // --- GERENCIAMENTO DE TELEFONES ---
  // Transaction: Apaga os antigos e insere os novos
  async replacePhones(userId: string, phones: string[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Remove todos os telefones desse usuário
      await tx.telefone_user.deleteMany({ where: { id_user: userId } });

      // 2. Insere os novos (se houver)
      if (phones.length > 0) {
        await tx.telefone_user.createMany({
          data: phones.map((tel) => ({
            id_user: userId,
            telefone: tel,
          })),
        });
      }
    });
  }

  // --- LEITURAS ---

  // Busca por ID (com telefones)
  async findById(user_id: string): Promise<UserWithPhones | null> {
    return prisma.user.findUnique({
      where: { user_id },
      include: { telefone_user: true },
    });
  }

  async findPhoneInUse(
    phones: string[],
    excludeUserId?: string
  ): Promise<string | null> {
    // Busca o primeiro registro que bata com a lista de telefones
    const found = await prisma.telefone_user.findFirst({
      where: {
        telefone: { in: phones }, // Verifica se está na lista
        id_user: excludeUserId ? { not: excludeUserId } : undefined, // Ignora o próprio usuário (no caso de update)
      },
      select: { telefone: true }, // Só precisamos saber qual telefone deu conflito
    });

    return found ? found.telefone : null;
  }

  // Busca por Email (com telefones)
  async findByEmail(email: string): Promise<UserWithPhones | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { telefone_user: true },
    });
  }

  async findAll(): Promise<UserWithPhones[]> {
    return prisma.user.findMany({
      include: { telefone_user: true },
    });
  }

  async findPaginated(page: number, perPage: number, lojaId?: string) {
    const offset = (page - 1) * perPage;

    // Filtro Base
    const where: Prisma.userWhereInput = {};

    // Se tiver lojaId, filtra usuários que tenham perfil nessa loja
    if (lojaId) {
      where.user_profile = {
        some: {
          id_loja: lojaId,
        },
      };
    }

    const total = await prisma.user.count({ where });

    const data = await prisma.user.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { data_criacao: "desc" },
      include: { telefone_user: true },
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // --- BUSCA COM FILTRO DE LOJA ---
  async searchPaginated(
    term: string,
    page: number,
    perPage: number,
    lojaId?: string
  ) {
    const offset = (page - 1) * perPage;

    // Filtro de Texto (Email)
    const textFilter: Prisma.userWhereInput = {
      email: { contains: term, mode: "insensitive" },
    };

    // Filtro de Loja
    const storeFilter: Prisma.userWhereInput = lojaId
      ? {
          user_profile: {
            some: { id_loja: lojaId },
          },
        }
      : {};

    // Combina os dois (AND)
    const where: Prisma.userWhereInput = {
      AND: [textFilter, storeFilter],
    };

    const total = await prisma.user.count({ where });

    const data = await prisma.user.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { email: "asc" },
      include: { telefone_user: true },
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async deleteById(user_id: string): Promise<User> {
    // O CASCADE do banco deleta os telefones automaticamente
    return prisma.user.delete({ where: { user_id } });
  }

  async updateById(user_id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { user_id }, data });
  }
}
