import { prisma } from "../../shared/database/prisma";
import {
  IDashboardRepository,
  RawFinancialData,
  RawPaymentData,
  RawRecentSaleData,
} from "./dashboard.dto";

export class DashboardRepository implements IDashboardRepository {
  async getFinancialAggregates(
    lojaId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RawFinancialData> {
    const result = await prisma.venda.aggregate({
      where: {
        id_loja: lojaId,
        data: { gte: startDate, lte: endDate },
        status: "FINALIZADA",
      },
      _sum: { total_final: true },
      _count: { id_venda: true },
    });

    // Retornamos exatamente a estrutura que definimos na interface RawFinancialData
    return {
      _sum: { total_final: result._sum.total_final },
      _count: { id_venda: result._count.id_venda },
    };
  }

  async countOpenCashiers(lojaId: string): Promise<number> {
    return prisma.caixa.count({
      where: {
        id_loja: lojaId,
        status: { in: ["ABERTO", "REABERTO"] },
      },
    });
  }

  async countLowStock(lojaId: string, threshold: number): Promise<number> {
    return prisma.produto_variacao.count({
      where: {
        produto: {
          id_loja: lojaId,
          ativo: true,
        },
        quantidade: { lte: threshold },
      },
    });
  }

  async getPaymentStats(
    lojaId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RawPaymentData[]> {
    const result = await prisma.pagamento_venda.groupBy({
      by: ["tipo_pagamento"],
      where: {
        venda: {
          id_loja: lojaId,
          data: { gte: startDate, lte: endDate },
          status: "FINALIZADA",
        },
      },
      _sum: { valor: true },
    });

    // CORREÇÃO: Usamos 'as unknown' como ponte segura.
    // O Prisma retorna um tipo complexo gerado dinamicamente que o TS não considera
    // idêntico à nossa interface manual, embora a estrutura dos dados seja a mesma.
    return result as unknown as RawPaymentData[];
  }

  async getRecentSales(
    lojaId: string,
    limit: number
  ): Promise<RawRecentSaleData[]> {
    const result = await prisma.venda.findMany({
      where: { id_loja: lojaId },
      take: limit,
      orderBy: { data_criacao: "desc" },
      select: {
        id_venda: true,
        total_final: true,
        hora: true,
        status: true,
        data_criacao: true,
        cliente: {
          select: { nome: true },
        },
        user: {
          select: {
            user_profile: {
              select: { nome: true },
              take: 1,
            },
          },
        },
      },
    });

    // Mesma lógica aqui: garantimos que o select acima satisfaz a interface
    return result as unknown as RawRecentSaleData[];
  }
}
