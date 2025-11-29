// src/repositories/log.repository.ts
import { prisma } from "../database/prisma";
import { Prisma } from "../generated/prisma/client";

export class LogRepository {
  // ==========================================
  // LOG DE ACESSO
  // ==========================================

  async createAccessLog(data: {
    id_user?: string;
    ip: string;
    user_agent: string;
    sucesso: boolean;
  }) {
    return prisma.log_acesso.create({ data });
  }

  async findAccessLogsPaginated(page: number, perPage: number) {
    const offset = (page - 1) * perPage;

    const total = await prisma.log_acesso.count();

    const data = await prisma.log_acesso.findMany({
      take: perPage,
      skip: offset,
      orderBy: { data: "desc" },
      include: { user: true }, // Traz dados do usuário
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async searchAccessLogs(term: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;

    // Filtra por IP ou Email do Usuário
    const where: Prisma.log_acessoWhereInput = {
      OR: [
        { ip: { contains: term, mode: "insensitive" } },
        { user: { email: { contains: term, mode: "insensitive" } } },
      ],
    };

    const total = await prisma.log_acesso.count({ where });

    const data = await prisma.log_acesso.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { data: "desc" },
      include: { user: true },
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // ==========================================
  // LOG DE SISTEMA
  // ==========================================

  async createSystemLog(data: {
    id_user?: string;
    acao: string;
    detalhes?: string;
  }) {
    return prisma.log_sistema.create({ data });
  }

  async findSystemLogsPaginated(page: number, perPage: number) {
    const offset = (page - 1) * perPage;

    const total = await prisma.log_sistema.count();

    const data = await prisma.log_sistema.findMany({
      take: perPage,
      skip: offset,
      orderBy: { data: "desc" },
      include: { user: true },
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async searchSystemLogs(term: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;

    // Filtra por Ação, Detalhes ou Email do Usuário
    const where: Prisma.log_sistemaWhereInput = {
      OR: [
        { acao: { contains: term, mode: "insensitive" } },
        { detalhes: { contains: term, mode: "insensitive" } },
        { user: { email: { contains: term, mode: "insensitive" } } },
      ],
    };

    const total = await prisma.log_sistema.count({ where });

    const data = await prisma.log_sistema.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { data: "desc" },
      include: { user: true },
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
