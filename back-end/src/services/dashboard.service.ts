// src/services/dashboard.service.ts
import { prisma } from "../database/prisma";
import { AppError } from "../middlewares/error.middleware";
import { DashboardSummaryDTO } from "../dtos/dashboard.dto";

export class DashboardService {
  /**
   * Busca todas as métricas do dashboard para uma loja específica.
   */
  async getSummary(lojaId: string): Promise<DashboardSummaryDTO> {
    if (!lojaId) throw new AppError("ID da loja é obrigatório.", 400);

    // 1. Definição de datas (HOJE: 00:00:00 até 23:59:59)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Executar Queries em Paralelo
    const [
      salesAggregates,
      openCashiersCount,
      lowStockCount,
      paymentMethods,
      recentSales,
    ] = await Promise.all([
      // A. Financeiro
      prisma.venda.aggregate({
        where: {
          id_loja: lojaId,
          data: { gte: startOfDay, lte: endOfDay },
          status: { not: "CANCELADA" },
        },
        _sum: { total_final: true },
        _count: { id_venda: true },
      }),

      // B. Caixas Abertos
      prisma.caixa.count({
        where: {
          id_loja: lojaId,
          status: { in: ["ABERTO", "REABERTO"] },
        },
      }),

      // C. Estoque Baixo (< 5)
      prisma.produto_variacao.count({
        where: {
          produto: {
            id_loja: lojaId,
            ativo: true,
          },
          quantidade: { lte: 5 },
        },
      }),

      // D. Gráfico de Pagamentos
      prisma.pagamento_venda.groupBy({
        by: ["tipo_pagamento"],
        where: {
          venda: {
            id_loja: lojaId,
            data: { gte: startOfDay, lte: endOfDay },
            status: { not: "CANCELADA" },
          },
        },
        _sum: { valor: true },
      }),

      // E. Feed Recente
      prisma.venda.findMany({
        where: { id_loja: lojaId },
        take: 5,
        orderBy: { data_criacao: "desc" },
        select: {
          id_venda: true,
          total_final: true,
          hora: true,
          status: true,
          cliente: { select: { nome: true } },
          user: {
            select: {
              user_profile: {
                select: { nome: true },
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    // 3. Processamento e Mapeamento para DTO

    // Financeiro
    const totalRevenue = Number(salesAggregates._sum.total_final ?? 0);
    const totalSalesCount = salesAggregates._count.id_venda ?? 0;
    const averageTicket =
      totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    // Gráficos
    const formattedCharts = paymentMethods.map((pm) => ({
      name: pm.tipo_pagamento,
      value: Number(pm._sum.valor ?? 0),
    }));

    // Feed
    const formattedFeed = recentSales.map((sale) => ({
      id: sale.id_venda,
      total: Number(sale.total_final),
      time: sale.hora
        ? new Date(sale.hora).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--",
      status: sale.status,
      customer: sale.cliente?.nome || "Consumidor Final",
      // Acessa o primeiro item do array de user_profile de forma segura
      seller: sale.user?.user_profile?.[0]?.nome || "Vendedor",
    }));

    // 4. Retorno Tipado
    return {
      financial: {
        revenue: totalRevenue,
        salesCount: totalSalesCount,
        ticket: averageTicket,
      },
      operational: {
        openCashiers: openCashiersCount,
        lowStock: lowStockCount,
      },
      charts: {
        paymentMethods: formattedCharts,
      },
      feed: formattedFeed,
    };
  }
}
