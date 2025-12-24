//src/modules/sale/venda-aux.repository.ts
import { IVendaAuxRepository, PrismaTx } from "./venda.dto";

export class VendaAuxRepository implements IVendaAuxRepository {
  async decrementStock(
    tx: PrismaTx,
    idVariacao: string,
    qtd: number
  ): Promise<void> {
    await tx.produto_variacao.update({
      where: { id_variacao: idVariacao },
      data: { quantidade: { decrement: qtd } },
    });
  }

  async incrementStock(
    tx: PrismaTx,
    idVariacao: string,
    qtd: number
  ): Promise<void> {
    await tx.produto_variacao.update({
      where: { id_variacao: idVariacao },
      data: { quantidade: { increment: qtd } },
    });
  }

  async createMovimentacao(
    tx: PrismaTx,
    data: {
      id_loja: string;
      id_caixa: string;
      id_venda: string;
      tipo: "ENTRADA" | "SAIDA";
      valor: number;
      descricao: string;
    }
  ): Promise<void> {
    await tx.movimentacao.create({
      data: {
        id_loja: data.id_loja,
        id_caixa: data.id_caixa,
        id_venda: data.id_venda,
        tipo: data.tipo,
        valor: data.valor,
        descricao: data.descricao,
      },
    });
  }
}
