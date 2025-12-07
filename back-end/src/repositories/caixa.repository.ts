//src/repositories/caixa.repository.ts
import { prisma } from "../database/prisma";
import { caixa, Prisma } from "../generated/prisma/client";
import { CaixaResponseDTO } from "../dtos/caixa.dto";
import { PaginatedResult } from "../dtos/common.dto";
// 1. DEFINIÇÃO ESTRITA DO JOIN (Agora direto no user_profile)
const caixaInclude = {
  user_profile: {
    select: {
      nome: true,
      // Se precisar do email: user: { select: { email: true } }
    },
  },
} satisfies Prisma.caixaInclude;

type CaixaWithDetails = Prisma.caixaGetPayload<{
  include: typeof caixaInclude;
}>;

export class CaixaRepository {
  async create(data: Prisma.caixaUncheckedCreateInput): Promise<caixa> {
    return prisma.caixa.create({ data });
  }

  // Mapeamento simplificado
  private mapToDTO(caixaRaw: CaixaWithDetails): CaixaResponseDTO {
    return {
      id_caixa: caixaRaw.id_caixa,
      id_loja: caixaRaw.id_loja,
      id_user_profile: caixaRaw.id_user_profile, // Nova coluna
      status: caixaRaw.status,
      saldo_inicial: caixaRaw.saldo_inicial,
      saldo_final: caixaRaw.saldo_final,
      data_abertura: caixaRaw.data_abertura,
      data_fechamento: caixaRaw.data_fechamento,
      // Agora o nome vem direto
      nome_responsavel: caixaRaw.user_profile?.nome ?? "Desconhecido",
    } as CaixaResponseDTO;
  }

  async findById(id_caixa: string): Promise<CaixaResponseDTO | null> {
    const result = await prisma.caixa.findUnique({
      where: { id_caixa },
      include: caixaInclude,
    });

    if (!result) return null;
    return this.mapToDTO(result);
  }

  // Busca caixa ativo pelo ID DO PERFIL
  async findActiveByProfile(id_user_profile: string): Promise<caixa | null> {
    return prisma.caixa.findFirst({
      where: {
        id_user_profile,
        status: { in: ["ABERTO", "REABERTO"] },
      },
    });
  }

  async update(
    id_caixa: string,
    data: Prisma.caixaUncheckedUpdateInput
  ): Promise<caixa> {
    return prisma.caixa.update({
      where: { id_caixa },
      data,
    });
  }

  async findAllPaginated(
    page: number,
    perPage: number,
    id_loja?: string
  ): Promise<PaginatedResult<CaixaResponseDTO>> {
    const skip = (page - 1) * perPage;
    const where: Prisma.caixaWhereInput = id_loja ? { id_loja } : {};

    const [total, caixas] = await Promise.all([
      prisma.caixa.count({ where }),
      prisma.caixa.findMany({
        where,
        take: perPage,
        skip,
        orderBy: { data_abertura: "desc" },
        include: caixaInclude,
      }),
    ]);

    return {
      data: caixas.map((c) => this.mapToDTO(c)),
      total,
      page,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async searchPaginated(
    term: string,
    page: number,
    perPage: number,
    id_loja?: string
  ): Promise<PaginatedResult<CaixaResponseDTO>> {
    const skip = (page - 1) * perPage;

    const where: Prisma.caixaWhereInput = {
      AND: [
        id_loja ? { id_loja } : {},
        {
          OR: [
            { status: { contains: term.toUpperCase() } },
            {
              // Busca simplificada: direto no user_profile
              user_profile: {
                nome: { contains: term, mode: "insensitive" },
              },
            },
          ],
        },
      ],
    };

    const [total, caixas] = await Promise.all([
      prisma.caixa.count({ where }),
      prisma.caixa.findMany({
        where,
        take: perPage,
        skip,
        orderBy: { data_abertura: "desc" },
        include: caixaInclude,
      }),
    ]);

    return {
      data: caixas.map((c) => this.mapToDTO(c)),
      total,
      page,
      lastPage: Math.ceil(total / perPage),
    };
  }

  // Retorna o somatório detalhado
  async getStatsById(id_caixa: string) {
    // 1. Agrupa por TIPO (Padrão)
    const porTipo = await prisma.movimentacao.groupBy({
      by: ["tipo"],
      where: { id_caixa },
      _sum: { valor: true },
    });

    // 2. Calcula especificamente o total de VENDAS (Entradas com id_venda)
    const totalVendas = await prisma.movimentacao.aggregate({
      where: {
        id_caixa,
        tipo: "ENTRADA",
        id_venda: { not: null }, // O PULO DO GATO
      },
      _sum: { valor: true },
    });

    return {
      porTipo,
      totalVendas: Number(totalVendas._sum.valor || 0),
    };
  }
}
