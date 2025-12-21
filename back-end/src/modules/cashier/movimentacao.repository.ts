//src/repositories/movimentacao.repository.ts
import { prisma } from "../../shared/database/prisma";
import {
  movimentacao,
  Prisma,
} from "./../../shared/database/generated/prisma/client";

import { PaginatedResult } from "../../shared/dtos/index.dto";

export class MovimentacaoRepository {
  async create(
    data: Prisma.movimentacaoUncheckedCreateInput
  ): Promise<movimentacao> {
    return prisma.movimentacao.create({
      data,
    });
  }

  async findById(id_movimentacao: string): Promise<movimentacao | null> {
    return prisma.movimentacao.findUnique({
      where: { id_movimentacao },
    });
  }

  async update(
    id_movimentacao: string,
    data: Prisma.movimentacaoUncheckedUpdateInput
  ): Promise<movimentacao> {
    return prisma.movimentacao.update({
      where: { id_movimentacao },
      data,
    });
  }

  async delete(id_movimentacao: string): Promise<void> {
    await prisma.movimentacao.delete({
      where: { id_movimentacao },
    });
  }

  // Busca todas as movimentações de um caixa específico
  async findByCaixaId(id_caixa: string): Promise<movimentacao[]> {
    return prisma.movimentacao.findMany({
      where: { id_caixa },
      orderBy: { data_criacao: "desc" },
    });
  }

  async findAllPaginated(
    page: number,
    perPage: number,
    id_loja?: string,
    id_caixa?: string // Opcional: filtro específico por caixa
  ): Promise<PaginatedResult<movimentacao>> {
    const skip = (page - 1) * perPage;

    // Monta o filtro dinamicamente
    const where: Prisma.movimentacaoWhereInput = {
      ...(id_loja && { id_loja }),
      ...(id_caixa && { id_caixa }),
    };

    const [total, data] = await Promise.all([
      prisma.movimentacao.count({ where }),
      prisma.movimentacao.findMany({
        where,
        take: perPage,
        skip,
        orderBy: { data_criacao: "desc" }, // Mais recentes primeiro
      }),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async searchPaginated(
    term: string,
    page: number,
    perPage: number,
    id_loja?: string,
    id_caixa?: string
  ): Promise<PaginatedResult<movimentacao>> {
    const skip = (page - 1) * perPage;

    // Busca por Descrição, Tipo ou Valor (convertido pra string)
    const where: Prisma.movimentacaoWhereInput = {
      AND: [
        id_loja ? { id_loja } : {},
        id_caixa ? { id_caixa } : {},
        {
          OR: [
            { descricao: { contains: term, mode: "insensitive" } },
            // Permite buscar por "SANGRIA" ou "ENTRADA"
            { tipo: { contains: term.toUpperCase() as string } },
          ],
        },
      ],
    };

    const [total, data] = await Promise.all([
      prisma.movimentacao.count({ where }),
      prisma.movimentacao.findMany({
        where,
        take: perPage,
        skip,
        orderBy: { data_criacao: "desc" },
      }),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / perPage),
    };
  }
}
