import { prisma } from "../../shared/database/prisma";
import { Prisma } from "../../shared/database/generated/prisma/client";
// 1. IMPORTAÇÃO DO DECIMAL.JS
import Decimal from "decimal.js";
import {
  ICaixaRepository,
  IMovimentacaoRepository,
  CaixaEntity,
  MovimentacaoEntity,
  CaixaCreateInput,
  CaixaUpdateInput,
  MovimentacaoCreateInput,
  MovimentacaoUpdateInput,
  RawCaixaStats,
} from "./caixa.dto";

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

const caixaInclude = {
  user_profile: {
    select: { nome: true },
  },
} satisfies Prisma.caixaInclude;

type CaixaFromDb = Prisma.caixaGetPayload<{ include: typeof caixaInclude }>;
type MovimentacaoFromDb = Prisma.movimentacaoGetPayload<object>;

// ============================================================================
// 1. REPOSITÓRIO DE CAIXA
// ============================================================================

export class CaixaRepository implements ICaixaRepository {
  private mapToEntity(row: CaixaFromDb): CaixaEntity {
    return {
      id_caixa: row.id_caixa,
      id_loja: row.id_loja,
      id_user_profile: row.id_user_profile,
      status: row.status,

      // 2. CONVERSÃO SEGURA
      saldo_inicial: new Decimal(row.saldo_inicial?.toString() || 0).toNumber(),
      saldo_final: row.saldo_final
        ? new Decimal(row.saldo_final.toString()).toNumber()
        : null,

      data_abertura: row.data_abertura,
      data_fechamento: row.data_fechamento,
      nome_responsavel: row.user_profile?.nome || "Desconhecido",
    };
  }

  async create(data: CaixaCreateInput): Promise<CaixaEntity> {
    const result = await prisma.caixa.create({
      data: {
        id_loja: data.id_loja,
        id_user_profile: data.id_user_profile,
        // Prisma lida bem recebendo number, mas se quiser garantir: new Decimal(data.saldo).toNumber()
        saldo_inicial: data.saldo_inicial,
        status: data.status,
        data_abertura: data.data_abertura,
      },
      include: caixaInclude,
    });
    return this.mapToEntity(result);
  }

  async update(id: string, data: CaixaUpdateInput): Promise<CaixaEntity> {
    const result = await prisma.caixa.update({
      where: { id_caixa: id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.saldo_final !== undefined && {
          saldo_final: data.saldo_final,
        }),
        ...(data.id_user_profile && { id_user_profile: data.id_user_profile }),
        ...(data.data_fechamento !== undefined && {
          data_fechamento: data.data_fechamento,
        }),
      },
      include: caixaInclude,
    });
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await prisma.caixa.delete({ where: { id_caixa: id } });
  }

  async findById(id: string): Promise<CaixaEntity | null> {
    const result = await prisma.caixa.findUnique({
      where: { id_caixa: id },
      include: caixaInclude,
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findAll(): Promise<CaixaEntity[]> {
    const result = await prisma.caixa.findMany({ include: caixaInclude });
    return result.map((c) => this.mapToEntity(c));
  }

  async findActiveByProfile(
    id_user_profile: string
  ): Promise<CaixaEntity | null> {
    const result = await prisma.caixa.findFirst({
      where: {
        id_user_profile,
        status: { in: ["ABERTO", "REABERTO"] },
      },
      include: caixaInclude,
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findPaginated(
    page: number,
    limit: number,
    id_loja?: string
  ): Promise<{ data: CaixaEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.caixaWhereInput = id_loja ? { id_loja } : {};

    const [total, caixas] = await Promise.all([
      prisma.caixa.count({ where }),
      prisma.caixa.findMany({
        where,
        take: limit,
        skip,
        orderBy: { data_abertura: "desc" },
        include: caixaInclude,
      }),
    ]);

    return { data: caixas.map((c) => this.mapToEntity(c)), total };
  }

  async searchPaginated(
    query: string,
    page: number,
    limit: number,
    id_loja?: string
  ): Promise<{ data: CaixaEntity[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.caixaWhereInput = {
      AND: [
        id_loja ? { id_loja } : {},
        {
          OR: [
            { status: { contains: query.toUpperCase() } },
            {
              user_profile: { nome: { contains: query, mode: "insensitive" } },
            },
          ],
        },
      ],
    };

    const [total, caixas] = await Promise.all([
      prisma.caixa.count({ where }),
      prisma.caixa.findMany({
        where,
        take: limit,
        skip,
        orderBy: { data_abertura: "desc" },
        include: caixaInclude,
      }),
    ]);

    return { data: caixas.map((c) => this.mapToEntity(c)), total };
  }

  async getRawStats(id_caixa: string): Promise<RawCaixaStats> {
    const porTipo = await prisma.movimentacao.groupBy({
      by: ["tipo"],
      where: { id_caixa },
      _sum: { valor: true },
    });

    const totalVendas = await prisma.movimentacao.aggregate({
      where: {
        id_caixa,
        tipo: "ENTRADA",
        id_venda: { not: null },
      },
      _sum: { valor: true },
    });

    return {
      porTipo: porTipo.map((t) => ({
        tipo: t.tipo,
        // Garante conversão segura na saída da agregação
        _sum: { valor: new Decimal(t._sum.valor?.toString() || 0).toNumber() },
      })),
      totalVendas: new Decimal(
        totalVendas._sum.valor?.toString() || 0
      ).toNumber(),
    };
  }
}

// ============================================================================
// 2. REPOSITÓRIO DE MOVIMENTAÇÃO
// ============================================================================

export class MovimentacaoRepository implements IMovimentacaoRepository {
  private mapToEntity(m: MovimentacaoFromDb): MovimentacaoEntity {
    return {
      id_movimentacao: m.id_movimentacao,
      id_loja: m.id_loja,
      id_caixa: m.id_caixa,
      id_venda: m.id_venda,
      tipo: m.tipo,

      // Conversão Decimal Segura
      valor: new Decimal(m.valor?.toString() || 0).toNumber(),

      descricao: m.descricao,
      data_criacao: m.data_criacao,
      ultima_atualizacao: m.ultima_atualizacao,
    };
  }

  async create(data: MovimentacaoCreateInput): Promise<MovimentacaoEntity> {
    const result = await prisma.movimentacao.create({
      data: {
        id_loja: data.id_loja,
        id_caixa: data.id_caixa,
        tipo: data.tipo,
        valor: data.valor,
        descricao: data.descricao,
        id_venda: data.id_venda,
      },
    });
    return this.mapToEntity(result);
  }

  async update(
    id: string,
    data: MovimentacaoUpdateInput
  ): Promise<MovimentacaoEntity> {
    const result = await prisma.movimentacao.update({
      where: { id_movimentacao: id },
      data: {
        ...(data.valor !== undefined && { valor: data.valor }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
      },
    });
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await prisma.movimentacao.delete({ where: { id_movimentacao: id } });
  }

  async findById(id: string): Promise<MovimentacaoEntity | null> {
    const result = await prisma.movimentacao.findUnique({
      where: { id_movimentacao: id },
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findPaginated(
    page: number,
    limit: number,
    id_loja?: string,
    id_caixa?: string
  ): Promise<{ data: MovimentacaoEntity[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.movimentacaoWhereInput = {
      ...(id_loja && { id_loja }),
      ...(id_caixa && { id_caixa }),
    };

    const [total, data] = await Promise.all([
      prisma.movimentacao.count({ where }),
      prisma.movimentacao.findMany({
        where,
        take: limit,
        skip,
        orderBy: { data_criacao: "desc" },
      }),
    ]);

    return { data: data.map((m) => this.mapToEntity(m)), total };
  }

  async searchPaginated(
    query: string,
    page: number,
    limit: number,
    id_loja?: string,
    id_caixa?: string
  ): Promise<{ data: MovimentacaoEntity[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.movimentacaoWhereInput = {
      AND: [
        id_loja ? { id_loja } : {},
        id_caixa ? { id_caixa } : {},
        {
          OR: [
            { descricao: { contains: query, mode: "insensitive" } },
            { tipo: { contains: query.toUpperCase() as string } },
          ],
        },
      ],
    };

    const [total, data] = await Promise.all([
      prisma.movimentacao.count({ where }),
      prisma.movimentacao.findMany({
        where,
        take: limit,
        skip,
        orderBy: { data_criacao: "desc" },
      }),
    ]);

    return { data: data.map((m) => this.mapToEntity(m)), total };
  }
}
