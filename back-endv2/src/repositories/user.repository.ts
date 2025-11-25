import { prisma } from "../database/prisma";
import { user as User } from "../generated/prisma/client";

export class UserRepository {
  // Cria um usuário novo no banco
  // SQL: INSERT INTO "user" (email, senha_hash, role) VALUES (...) RETURNING *;
  async create(data: {
    email: string;
    senha_hash: string;
    role?: string;
  }): Promise<User> {
    // O Prisma gera o ID (uuid) e pega a data atual automaticamente.
    // O campo 'ativo' entra como 'true' (default do banco).
    return prisma.user.create({ data });
  }

  // Deleta um usuário pelo ID
  // SQL: DELETE FROM "user" WHERE user_id = '...' RETURNING *;
  async deleteById(user_id: string): Promise<User> {
    return prisma.user.delete({ where: { user_id } });
  }

  // Atualiza dados. O segredo aqui é o 'Partial<User>'.
  // Partial<User> significa: "Um objeto que pode ter ALGUNS campos de User, não precisa de todos".
  // SQL: UPDATE "user" SET ... (só os campos que vieram) WHERE user_id = '...';
  async updateById(user_id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { user_id }, data });
  }

  // Busca um único usuário pelo ID (PK)
  // SQL: SELECT * FROM "user" WHERE user_id = '...' LIMIT 1;
  async findById(user_id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { user_id } });
  }

  // Busca pelo Email (Unique Key)
  // SQL: SELECT * FROM "user" WHERE email = '...' LIMIT 1;
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  // Busca TODOS (cuidado, em tabelas grandes isso trava o banco)
  // SQL: SELECT * FROM "user";
  async findAll(): Promise<User[]> {
    return prisma.user.findMany();
  }

  // Paginação "na unha" (Raw Query)
  // Útil quando o Prisma padrão não resolve ou para performance extrema.
  async findPaginated(page: number, perPage: number) {
    // OFFSET é quantos registros pular. Ex: Pág 2 (10 itens) -> Pula os 10 primeiros.
    const offset = (page - 1) * perPage;

    // Passo 1: Contar o total para saber quantas páginas existem
    // SQL: SELECT COUNT(1) AS count FROM "user";
    const countResult: Array<{ count: bigint }> = await prisma.$queryRaw`
      SELECT COUNT(1) AS count FROM "user"
    `;
    const total = Number(countResult[0]?.count ?? 0);

    // Passo 2: Buscar os dados da página atual
    // SQL: SELECT * FROM "user" ORDER BY data_criacao DESC LIMIT 10 OFFSET 10;
    const data: User[] = await prisma.$queryRaw`
      SELECT * FROM "user"
      ORDER BY data_criacao DESC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // Busca com filtro (LIKE)
  async searchPaginated(term: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;
    const like = `%${term}%`; // Ex: '%danilo%' acha 'danilo', 'daniel', 'adanilo'

    // SQL: SELECT COUNT(1) ... WHERE email ILIKE '%termo%'; (ILIKE ignora maiúscula/minúscula)
    const countResult: Array<{ count: bigint }> = await prisma.$queryRaw`
      SELECT COUNT(1) AS count FROM "user" WHERE email ILIKE ${like}
    `;
    const total = Number(countResult[0]?.count ?? 0);

    // SQL: SELECT * ... WHERE email ILIKE '%termo%' ... LIMIT X OFFSET Y;
    const data: User[] = await prisma.$queryRaw`
      SELECT * FROM "user"
      WHERE email ILIKE ${like}
      ORDER BY email ASC
      LIMIT ${perPage} OFFSET ${offset}
    `;

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
