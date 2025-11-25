import { prisma } from "../database/prisma";
import { user_profile as UserProfile } from "../generated/prisma/client";

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

  // Paginação via SQL Raw
  async findPaginated(page: number, perPage: number) {
    // Cálculo do OFFSET (pular registros anteriores)
    const offset = (page - 1) * perPage;

    // 1. Contar total de registros
    // SQL: SELECT COUNT(1) AS count FROM "user_profile";
    const countResult: Array<{ count: bigint }> = await prisma.$queryRaw`
      SELECT COUNT(1) AS count FROM "user_profile"
    `;
    const total = Number(countResult[0]?.count ?? 0);

    // 2. Buscar os dados da página
    // SQL: SELECT * FROM "user_profile" ORDER BY nome ASC LIMIT X OFFSET Y;
    const data: UserProfile[] = await prisma.$queryRaw`
      SELECT * FROM "user_profile"
      ORDER BY nome ASC
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

  // Busca textual em múltiplos campos (Nome OU cpf_cnpj OU Cargo...)
  async searchPaginated(term: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;
    const like = `%${term}%`; // Prepara termo para ILIKE (ex: %maria%)

    // 1. Conta quantos registros batem com o filtro
    // SQL: SELECT COUNT(1) ... WHERE nome ILIKE '%term%' OR cpf_cnpj ILIKE ...
    const countResult: Array<{ count: bigint }> = await prisma.$queryRaw`
      SELECT COUNT(1) AS count FROM "user_profile"
      WHERE nome ILIKE ${like}
         OR cpf_cnpj ILIKE ${like}
         OR cargo ILIKE ${like}
         OR tipo_perfil ILIKE ${like}
    `;
    const total = Number(countResult[0]?.count ?? 0);

    // 2. Busca os dados filtrados
    // SQL: SELECT * ... WHERE (filtros OR) ORDER BY nome LIMIT X OFFSET Y;
    const data: UserProfile[] = await prisma.$queryRaw`
      SELECT * FROM "user_profile"
      WHERE nome ILIKE ${like}
         OR cpf_cnpj ILIKE ${like}
         OR cargo ILIKE ${like}
         OR tipo_perfil ILIKE ${like}
      ORDER BY nome ASC
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
