import { prisma } from "../database/prisma";
import { loja as Loja } from "../generated/prisma/client"; // Ou "@prisma/client"

export class LojaRepository {
  // Cria uma loja
  async create(data: {
    nome: string;
    cnpj_cpf?: string;
    admin_user_id?: string;
  }): Promise<Loja> {
    return prisma.loja.create({ data });
  }

  // Busca por ID (PK continua sendo Unique)
  async findById(id_loja: string): Promise<Loja | null> {
    return prisma.loja.findUnique({ where: { id_loja } });
  }

  // CORREÇÃO: Usar findFirst pois removemos a constraint UNIQUE do banco
  async findByDoc(cnpj_cpf: string): Promise<Loja | null> {
    return prisma.loja.findFirst({
      where: { cnpj_cpf },
    });
  }

  // Atualiza
  async updateById(id_loja: string, data: Partial<Loja>): Promise<Loja> {
    return prisma.loja.update({ where: { id_loja }, data });
  }

  // Deleta
  async deleteById(id_loja: string): Promise<Loja> {
    return prisma.loja.delete({ where: { id_loja } });
  }

  // Lista todas
  async findAll(): Promise<Loja[]> {
    return prisma.loja.findMany();
  }
}
