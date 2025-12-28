import { IDashboardRepository, DashboardSummaryDTO } from "./dashboard.dto";
import { DashboardRepository } from "./dashboard.repository";
import { AppError } from "../../app/middleware/error.middleware";
// 1. Importação do Decimal
import Decimal from "decimal.js";

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

    // 2. Uso do Decimal para totais financeiros
    // O Prisma retorna null se não houver vendas, então usamos || 0
    const totalRevenueDecimal = new Decimal(
      salesStats._sum.total_final?.toString() || 0
    );
    const totalRevenue = totalRevenueDecimal.toNumber();

    const totalSalesCount = salesStats._count.id_venda ?? 0;

    // 3. Cálculo do Ticket Médio com precisão (Divisão)
    // Se count > 0, faz a divisão. Se não, é 0.
    const averageTicket =
      totalSalesCount > 0
        ? totalRevenueDecimal.div(totalSalesCount).toNumber()
        : 0;

    // 4. Formatação dos gráficos (Parse Seguro)
    const formattedCharts = paymentStats.map((pm) => ({
      name: pm.tipo_pagamento,
      value: new Decimal(pm._sum.valor?.toString() || 0).toNumber(),
    }));

    // 5. Formatação do Feed (Parse Seguro)
    const formattedFeed = recentSalesRaw.map((sale) => {
      const sellerName = sale.user?.user_profile?.[0]?.nome || "Vendedor";
      return {
        id: sale.id_venda,
        // Convertendo com Decimal
        total: new Decimal(sale.total_final?.toString() || 0).toNumber(),

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
