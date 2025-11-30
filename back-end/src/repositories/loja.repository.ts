//src/repositories/loja.repository.ts
import { prisma } from "../database/prisma";
import { loja as Loja } from "../generated/prisma/client";

export class LojaRepository {
  // Cria uma loja
  // SQL: INSERT INTO loja (nome, cnpj_cpf, admin_user_id) VALUES (...) RETURNING *;
  async create(data: {
    nome: string;
    cnpj_cpf?: string;
    admin_user_id?: string;
  }): Promise<Loja> {
    return prisma.loja.create({ data });
  }

  // Busca por ID
  // SQL: SELECT * FROM loja WHERE id_loja = '...' LIMIT 1;
  async findById(id_loja: string): Promise<Loja | null> {
    return prisma.loja.findUnique({ where: { id_loja } });
  }

  // Busca por Documento (para evitar duplicidade)
  // SQL: SELECT * FROM loja WHERE cnpj_cpf = '...' LIMIT 1;
  async findByDoc(cnpj_cpf: string): Promise<Loja | null> {
    return prisma.loja.findUnique({ where: { cnpj_cpf } });
  }

  // Atualiza usando Partial (só o que mudou)
  // SQL: UPDATE loja SET ... WHERE id_loja = '...';
  async updateById(id_loja: string, data: Partial<Loja>): Promise<Loja> {
    return prisma.loja.update({ where: { id_loja }, data });
  }

  // Deleta
  // SQL: DELETE FROM loja WHERE id_loja = '...';
  async deleteById(id_loja: string): Promise<Loja> {
    return prisma.loja.delete({ where: { id_loja } });
  }

  // Lista todas
  // SQL: SELECT * FROM loja;
  async findAll(): Promise<Loja[]> {
    return prisma.loja.findMany();
  }
}
