import { prisma } from "../../shared/database/prisma";
import {
  ILojaRepository,
  LojaEntity,
  CreateLojaDTO,
  UpdateLojaDTO,
} from "./loja.dto";
import { RepositoryPaginatedResult } from "../../shared/dtos/index.dto";
import {
  Prisma,
  loja as LojaModel,
} from "../../shared/database/generated/prisma/client";

export class LojaRepository implements ILojaRepository {
  // Mapper: Converte do Prisma para Entidade de Domínio
  private mapToEntity(loja: LojaModel): LojaEntity {
    return {
      id_loja: loja.id_loja,
      admin_user_id: loja.admin_user_id,
      nome: loja.nome,
      cnpj_cpf: loja.cnpj_cpf,
      data_criacao: loja.data_criacao,
      ultima_atualizacao: loja.ultima_atualizacao,
    };
  }

  async create(data: CreateLojaDTO): Promise<LojaEntity> {
    const loja = await prisma.loja.create({
      data: {
        nome: data.nome,
        cnpj_cpf: data.cnpj_cpf,
        admin_user_id: data.admin_user_id,
      },
    });
    return this.mapToEntity(loja);
  }

  async update(id: string, data: UpdateLojaDTO): Promise<LojaEntity> {
    const loja = await prisma.loja.update({
      where: { id_loja: id },
      data: {
        nome: data.nome,
        cnpj_cpf: data.cnpj_cpf,
        admin_user_id: data.admin_user_id,
        ultima_atualizacao: new Date(),
      },
    });
    return this.mapToEntity(loja);
  }

  async findById(id: string): Promise<LojaEntity | null> {
    const loja = await prisma.loja.findUnique({
      where: { id_loja: id },
    });
    return loja ? this.mapToEntity(loja) : null;
  }

  async findByDoc(cnpj_cpf: string): Promise<LojaEntity | null> {
    const loja = await prisma.loja.findFirst({
      where: { cnpj_cpf },
    });
    return loja ? this.mapToEntity(loja) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.loja.delete({ where: { id_loja: id } });
  }

  async findAll(): Promise<LojaEntity[]> {
    const lojas = await prisma.loja.findMany();
    return lojas.map((l) => this.mapToEntity(l));
  }

  // Métodos de paginação exigidos pela Interface Base
  // (Implementação básica pois geralmente não se pagina lojas da mesma forma que usuários)
  async findPaginated(
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<LojaEntity>> {
    return this.searchPaginated("", page, limit);
  }

  async searchPaginated(
    query: string,
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<LojaEntity>> {
    const skip = (page - 1) * limit;

    const where: Prisma.lojaWhereInput = query
      ? {
          OR: [
            { nome: { contains: query, mode: "insensitive" } },
            { cnpj_cpf: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.loja.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: "asc" },
      }),
      prisma.loja.count({ where }),
    ]);

    return { data: data.map((l) => this.mapToEntity(l)), total };
  }
}
