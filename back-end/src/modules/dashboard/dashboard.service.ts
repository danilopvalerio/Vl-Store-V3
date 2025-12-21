import { IDashboardRepository, DashboardSummaryDTO } from "./dashboard.dto";
import { DashboardRepository } from "./dashboard.repository";
import { AppError } from "../../app/middleware/error.middleware";

export class DashboardService {
  constructor(private repo: IDashboardRepository = new DashboardRepository()) {}

  async getSummary(lojaId: string): Promise<DashboardSummaryDTO> {
    if (!lojaId) throw new AppError("ID da loja é obrigatório.", 400);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [salesStats, openCashiers, lowStock, paymentStats, recentSalesRaw] =
      await Promise.all([
        this.repo.getFinancialAggregates(lojaId, startOfDay, endOfDay),
        this.repo.countOpenCashiers(lojaId),
        this.repo.countLowStock(lojaId, 5),
        this.repo.getPaymentStats(lojaId, startOfDay, endOfDay),
        this.repo.getRecentSales(lojaId, 5),
      ]);

    const totalRevenue = salesStats._sum.total_final
      ? Number(salesStats._sum.total_final)
      : 0;
    const totalSalesCount = salesStats._count.id_venda ?? 0;
    const averageTicket =
      totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    const formattedCharts = paymentStats.map((pm) => ({
      name: pm.tipo_pagamento,
      value: pm._sum.valor ? Number(pm._sum.valor) : 0,
    }));

    const formattedFeed = recentSalesRaw.map((sale) => {
      const sellerName = sale.user?.user_profile?.[0]?.nome || "Vendedor";
      return {
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
        seller: sellerName,
      };
    });

    return {
      financial: {
        revenue: totalRevenue,
        salesCount: totalSalesCount,
        ticket: averageTicket,
      },
      operational: {
        openCashiers: openCashiers,
        lowStock: lowStock,
      },
      charts: {
        paymentMethods: formattedCharts,
      },
      feed: formattedFeed,
    };
  }
}
