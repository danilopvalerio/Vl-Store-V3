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

  async findAccessLogsPaginated(idLoja: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;

    // Filtro base: Usuário tem perfil nesta loja
    const where: Prisma.log_acessoWhereInput = {
      user: {
        user_profile: {
          some: { id_loja: idLoja },
        },
      },
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

  async searchAccessLogs(
    idLoja: string,
    term: string,
    page: number,
    perPage: number
  ) {
    const offset = (page - 1) * perPage;

    // Filtra por Loja E (IP ou Email)
    const where: Prisma.log_acessoWhereInput = {
      AND: [
        {
          user: {
            user_profile: {
              some: { id_loja: idLoja },
            },
          },
        },
        {
          OR: [
            { ip: { contains: term, mode: "insensitive" } },
            { user: { email: { contains: term, mode: "insensitive" } } },
          ],
        },
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

  async findSystemLogsPaginated(idLoja: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;

    // Filtro por loja via user_profile
    const where: Prisma.log_sistemaWhereInput = {
      user: {
        user_profile: {
          some: { id_loja: idLoja },
        },
      },
    };

    const total = await prisma.log_sistema.count({ where });

    const data = await prisma.log_sistema.findMany({
      take: perPage,
      skip: offset,
      where,
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

  async searchSystemLogs(
    idLoja: string,
    term: string,
    page: number,
    perPage: number
  ) {
    const offset = (page - 1) * perPage;

    // Filtra por Loja E (Ação ou Detalhes ou Email)
    const where: Prisma.log_sistemaWhereInput = {
      AND: [
        {
          user: {
            user_profile: {
              some: { id_loja: idLoja },
            },
          },
        },
        {
          OR: [
            { acao: { contains: term, mode: "insensitive" } },
            { detalhes: { contains: term, mode: "insensitive" } },
            { user: { email: { contains: term, mode: "insensitive" } } },
          ],
        },
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
