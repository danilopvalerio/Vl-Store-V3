import { prisma } from "../../shared/database/prisma";
import {
  ILojaRepository,
  CreateLojaDTO,
  UpdateLojaDTO,
  LojaResponseDTO,
} from "./loja.dto";
import { RepositoryPaginatedResult } from "../../shared/dtos/index.dto";
import { loja, Prisma } from "../../shared/database/generated/prisma/client";

export class LojaRepository implements ILojaRepository {
  // MAPPER: Prisma -> DTO
  private mapToDTO(raw: loja): LojaResponseDTO {
    return {
      id_loja: raw.id_loja,
      admin_user_id: raw.admin_user_id,
      nome: raw.nome,
      cnpj_cpf: raw.cnpj_cpf,
      data_criacao: raw.data_criacao,
      ultima_atualizacao: raw.ultima_atualizacao,
    };
  }

  // --- CRUD ---

  async create(data: CreateLojaDTO): Promise<LojaResponseDTO> {
    // Nota: O Service usará transação, mas este método base existe para casos simples
    const newLoja = await prisma.loja.create({
      data: {
        nome: data.nome,
        cnpj_cpf: data.cnpj_cpf,
        admin_user_id: data.admin_user_id,
      },
    });
    return this.mapToDTO(newLoja);
  }

  async update(id: string, data: UpdateLojaDTO): Promise<LojaResponseDTO> {
    const updated = await prisma.loja.update({
      where: { id_loja: id },
      data: {
        nome: data.nome,
        cnpj_cpf: data.cnpj_cpf,
        admin_user_id: data.admin_user_id,
        ultima_atualizacao: new Date(),
      },
    });
    return this.mapToDTO(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.loja.delete({ where: { id_loja: id } });
  }

  async findById(id: string): Promise<LojaResponseDTO | null> {
    const found = await prisma.loja.findUnique({ where: { id_loja: id } });
    return found ? this.mapToDTO(found) : null;
  }

  async findAll(): Promise<LojaResponseDTO[]> {
    const all = await prisma.loja.findMany();
    return all.map((l) => this.mapToDTO(l));
  }

  async findByDoc(cnpj_cpf: string): Promise<LojaResponseDTO | null> {
    const found = await prisma.loja.findFirst({ where: { cnpj_cpf } });
    return found ? this.mapToDTO(found) : null;
  }

  // --- PAGINAÇÃO ---
  async findPaginated(page: number, limit: number) {
    return this.searchPaginated("", page, limit);
  }

  async searchPaginated(query: string, page: number, limit: number) {
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

    return { data: data.map((l) => this.mapToDTO(l)), total };
  }
}
