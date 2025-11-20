// src/repositories/user.repository.ts
import { prisma } from "../database/prisma";
import { user as User } from "../generated/prisma/client";

export class UserRepository {
  // Create (insert)
  async create(data: {
    email: string;
    senha_hash: string;
    role?: string;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  // Delete (hard delete)
  async deleteById(user_id: string): Promise<User> {
    return prisma.user.delete({ where: { user_id } });
  }

  // Update (partial)
  async updateById(
    user_id: string,
    data: Partial<{
      email: string;
      senha_hash: string;
      ativo: boolean;
      role: string;
    }>
  ): Promise<User> {
    return prisma.user.update({ where: { user_id }, data });
  }

  // Get by id
  async findById(user_id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { user_id } });
  }

  // Get by email
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  // Get all (no pagination)
  async findAll(): Promise<User[]> {
    return prisma.user.findMany();
  }

  // Paginated GET (SQL puro)
  async findPaginated(page = 1, perPage = 10) {
    const offset = (page - 1) * perPage;

    // total count
    const countResult: Array<{ count: bigint }> = await prisma.$queryRaw`
      SELECT COUNT(1) AS count
      FROM "user"
    `;

    // Conversão segura de BigInt para Number
    const total = Number(countResult[0]?.count ?? 0);

    // data page
    const data: User[] = await prisma.$queryRaw`
      SELECT *
      FROM "user"
      ORDER BY data_criacao DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const totalPages = Math.ceil(total / perPage);

    return { data, total, page, perPage, totalPages };
  }

  // Search paginated (SQL puro)
  async searchPaginated(term: string, page = 1, perPage = 10) {
    const offset = (page - 1) * perPage;
    const like = `%${term}%`;

    const countResult: Array<{ count: bigint }> = await prisma.$queryRaw`
      SELECT COUNT(1) AS count
      FROM "user"
      WHERE email ILIKE ${like}
    `;

    // Conversão segura de BigInt para Number
    const total = Number(countResult[0]?.count ?? 0);

    // OBS: Se o seu frontend esperar "createdAt" em vez de "data_criacao",
    // você deve usar "AS" aqui. Ex: SELECT data_criacao AS "createdAt"
    const data: User[] = await prisma.$queryRaw`
      SELECT
        user_id,
        email,
        ativo,
        data_criacao,
        ultima_atualizacao,
        role
      FROM "user"
      WHERE email ILIKE ${like}
      ORDER BY email ASC
      LIMIT ${perPage}
      OFFSET ${offset}
    `;

    const totalPages = Math.ceil(total / perPage);

    return {
      data,
      total,
      page,
      perPage,
      totalPages,
    };
  }
}
