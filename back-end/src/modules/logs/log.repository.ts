import { prisma } from "../../shared/database/prisma";
import { Prisma } from "../../shared/database/generated/prisma/client";
import {
  ILogBaseRepository,
  RepositoryPaginatedResult,
} from "../../shared/dtos/index.dto";
import {
  LogAccessEntity,
  LogSystemEntity,
  CreateLogAcessoDTO,
  CreateLogSistemaDTO,
} from "./log.dto";

// Tipos auxiliares do Prisma para garantir o include do user
type LogAccessWithUser = Prisma.log_acessoGetPayload<{
  include: { user: true };
}>;
type LogSystemWithUser = Prisma.log_sistemaGetPayload<{
  include: { user: true };
}>;

// ============================================================================
// REPOSITÓRIO DE LOGS DE ACESSO
// ============================================================================
export class AccessLogRepository
  implements ILogBaseRepository<LogAccessEntity, CreateLogAcessoDTO>
{
  private mapToEntity(log: LogAccessWithUser): LogAccessEntity {
    return {
      id_log_acesso: log.id_log_acesso,
      id_user: log.id_user,
      ip: log.ip,
      user_agent: log.user_agent,
      sucesso: log.sucesso,
      data: log.data,
      user: log.user,
    };
  }

  async create(data: CreateLogAcessoDTO): Promise<void> {
    await prisma.log_acesso.create({
      data: {
        id_user: data.id_user,
        ip: data.ip,
        user_agent: data.user_agent,
        sucesso: data.sucesso,
      },
    });
  }

  async findPaginated(
    idLoja: string,
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<LogAccessEntity>> {
    const offset = (page - 1) * limit;

    // Filtro: Usuário que executou a ação pertence à loja solicitada
    const where: Prisma.log_acessoWhereInput = {
      user: { user_profile: { some: { id_loja: idLoja } } },
    };

    const [dataRaw, total] = await Promise.all([
      prisma.log_acesso.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { data: "desc" },
        include: { user: true },
      }),
      prisma.log_acesso.count({ where }),
    ]);

    return { data: dataRaw.map((l) => this.mapToEntity(l)), total };
  }

  async searchPaginated(
    idLoja: string,
    query: string,
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<LogAccessEntity>> {
    const offset = (page - 1) * limit;

    const where: Prisma.log_acessoWhereInput = {
      AND: [
        { user: { user_profile: { some: { id_loja: idLoja } } } },
        {
          OR: [
            { ip: { contains: query, mode: "insensitive" } },
            { user: { email: { contains: query, mode: "insensitive" } } },
          ],
        },
      ],
    };

    const [dataRaw, total] = await Promise.all([
      prisma.log_acesso.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { data: "desc" },
        include: { user: true },
      }),
      prisma.log_acesso.count({ where }),
    ]);

    return { data: dataRaw.map((l) => this.mapToEntity(l)), total };
  }
}

// ============================================================================
// REPOSITÓRIO DE LOGS DE SISTEMA
// ============================================================================
export class SystemLogRepository
  implements ILogBaseRepository<LogSystemEntity, CreateLogSistemaDTO>
{
  private mapToEntity(log: LogSystemWithUser): LogSystemEntity {
    return {
      id_log_sistema: log.id_log_sistema,
      id_user: log.id_user,
      acao: log.acao,
      detalhes: log.detalhes,
      data: log.data,
      user: log.user,
    };
  }

  async create(data: CreateLogSistemaDTO): Promise<void> {
    await prisma.log_sistema.create({
      data: {
        id_user: data.id_user,
        acao: data.acao,
        detalhes: data.detalhes,
      },
    });
  }

  async findPaginated(
    idLoja: string,
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<LogSystemEntity>> {
    const offset = (page - 1) * limit;

    const where: Prisma.log_sistemaWhereInput = {
      user: { user_profile: { some: { id_loja: idLoja } } },
    };

    const [dataRaw, total] = await Promise.all([
      prisma.log_sistema.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { data: "desc" },
        include: { user: true },
      }),
      prisma.log_sistema.count({ where }),
    ]);

    return { data: dataRaw.map((l) => this.mapToEntity(l)), total };
  }

  async searchPaginated(
    idLoja: string,
    query: string,
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<LogSystemEntity>> {
    const offset = (page - 1) * limit;

    const where: Prisma.log_sistemaWhereInput = {
      AND: [
        { user: { user_profile: { some: { id_loja: idLoja } } } },
        {
          OR: [
            { acao: { contains: query, mode: "insensitive" } },
            { detalhes: { contains: query, mode: "insensitive" } },
            { user: { email: { contains: query, mode: "insensitive" } } },
          ],
        },
      ],
    };

    const [dataRaw, total] = await Promise.all([
      prisma.log_sistema.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { data: "desc" },
        include: { user: true },
      }),
      prisma.log_sistema.count({ where }),
    ]);

    return { data: dataRaw.map((l) => this.mapToEntity(l)), total };
  }
}
