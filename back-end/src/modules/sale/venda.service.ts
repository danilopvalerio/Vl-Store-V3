import { prisma } from "../../shared/database/prisma";
import Decimal from "decimal.js";
import { VendaRepository } from "./venda.repository";
import { ItemVendaRepository } from "./item_venda.repository";
import { VendaAuxRepository } from "./venda-aux.repository";
import {
  CreateVendaDTO,
  UpdateStatusDTO,
  PreparedItemVenda,
} from "./venda.dto";
import { AppError } from "../../app/middleware/error.middleware";
import { LogService } from "../logs/log.service";
import { isValidUUID } from "../../shared/utils/validation";

export class VendaService {
  constructor(
    private vendaRepo: VendaRepository,
    private itemRepo: ItemVendaRepository,
    private auxRepo: VendaAuxRepository,
    private logService: LogService
  ) {}

  async createVenda(data: CreateVendaDTO) {
    if (!isValidUUID(data.id_loja)) throw new AppError("Loja inválida");
    if (!data.itens.length) throw new AppError("Venda sem itens");

    const variacaoIds = data.itens.map((i) => i.id_variacao);

    const dbVariacoes = await prisma.produto_variacao.findMany({
      where: { id_variacao: { in: variacaoIds } },
      select: { id_variacao: true, quantidade: true, valor: true, nome: true },
    });

    let totalItens = new Decimal(0);
    const itensFinal: PreparedItemVenda[] = [];

    for (const item of data.itens) {
      const variacao = dbVariacoes.find(
        (v) => v.id_variacao === item.id_variacao
      );
      if (!variacao)
        throw new AppError(`Variação ${item.id_variacao} não encontrada`);

      const precoBase = new Decimal(
        item.preco_unitario_override ?? Number(variacao.valor)
      );

      const quantidade = new Decimal(item.quantidade);
      const desconto = new Decimal(item.desconto_por_item || 0);
      const acrescimo = new Decimal(item.acrescimo_por_item || 0);

      const precoFinalUnitario = precoBase.minus(desconto).plus(acrescimo);
      const subtotal = precoFinalUnitario.times(quantidade);

      totalItens = totalItens.plus(subtotal);

      itensFinal.push({
        id_variacao: item.id_variacao,
        quantidade: item.quantidade,
        preco_unitario: precoBase.toNumber(),
        desconto_por_item: desconto.toNumber(),
        acrescimo_por_item: acrescimo.toNumber(),
        preco_final_unitario: precoFinalUnitario.toNumber(),
        preco_subtotal: subtotal.toNumber(),
      });
    }

    const totalFinal = totalItens
      .minus(new Decimal(data.desconto_global || 0))
      .plus(new Decimal(data.acrescimo_global || 0));

    const totalPago = data.pagamentos.reduce(
      (acc, p) => acc.plus(p.valor),
      new Decimal(0)
    );

    const status =
      totalPago.greaterThanOrEqualTo(totalFinal) && totalPago.greaterThan(0)
        ? "FINALIZADA"
        : "PENDENTE";

    const vendaId = await prisma.$transaction(async (tx) => {
      const venda = await this.vendaRepo.createWithTx(tx, {
        ...data,
        status,
        total_final: totalFinal.toNumber(),
        valor_pago: totalPago.toNumber(),
      });

      await this.itemRepo.createManyWithTx(tx, venda.id_venda, itensFinal);

      if (status === "FINALIZADA") {
        for (const item of itensFinal) {
          await this.auxRepo.decrementStock(
            tx,
            item.id_variacao,
            item.quantidade
          );
        }

        if (data.id_caixa) {
          await this.auxRepo.createMovimentacao(tx, {
            id_loja: data.id_loja,
            id_caixa: data.id_caixa,
            id_venda: venda.id_venda,
            tipo: "ENTRADA",
            valor: totalPago.toNumber(),
            descricao: `Venda #${venda.id_venda.substring(0, 8)}`,
          });
        }
      }

      return venda.id_venda;
    });

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Criar Venda",
      detalhes: `Venda ${vendaId} criada`,
    });

    return this.vendaRepo.findById(vendaId);
  }

  async mudarStatus(id: string, data: UpdateStatusDTO) {
    const venda = await this.vendaRepo.findById(id);
    if (!venda) throw new AppError("Venda não encontrada");

    if (data.status !== "CANCELADA")
      throw new AppError("Apenas cancelamento permitido");

    if (venda.status === "CANCELADA") throw new AppError("Venda já cancelada");

    await prisma.$transaction(async (tx) => {
      await this.vendaRepo.updateStatusWithTx(tx, id, "CANCELADA");

      if (venda.status === "FINALIZADA") {
        // ✅ CORREÇÃO: Mudamos de venda.item_venda para venda.itens (nome no DTO)
        for (const item of venda.itens) {
          await this.auxRepo.incrementStock(
            tx,
            item.id_variacao,
            item.quantidade
          );
        }
      }
    });
  }

  getById(id: string) {
    return this.vendaRepo.findById(id);
  }

  getPaginated(page: number, limit: number, lojaId?: string) {
    return this.vendaRepo.findPaginated(page, limit, lojaId);
  }

  searchPaginated(term: string, page: number, limit: number, lojaId?: string) {
    return this.vendaRepo.searchPaginated(term, page, limit, lojaId);
  }

  getItensPaginated(id: string, page: number, limit: number) {
    return this.itemRepo.findPaginated(page, limit, id);
  }

  async addPayment(
    id_venda: string,
    data: {
      pagamentos: { tipo_pagamento: string; valor: number }[];
      actorUserId: string;
    }
  ) {
    const venda = await this.vendaRepo.findById(id_venda);
    if (!venda) throw new AppError("Venda não encontrada");

    if (venda.status === "FINALIZADA")
      throw new AppError("Venda já está finalizada");
    if (venda.status === "CANCELADA")
      throw new AppError("Venda está cancelada e não aceita pagamentos");

    // No novo DTO, valor_pago já é number. Passamos para Decimal para calculos precisos.
    const valorJaPago = new Decimal(venda.valor_pago);
    const valorTotalVenda = new Decimal(venda.total_final);

    const novosPagamentosTotal = data.pagamentos.reduce(
      (acc, p) => acc.plus(new Decimal(p.valor)),
      new Decimal(0)
    );

    const novoValorPago = valorJaPago.plus(novosPagamentosTotal);

    const deveFinalizar = novoValorPago.greaterThanOrEqualTo(valorTotalVenda);
    const novoStatus = deveFinalizar ? "FINALIZADA" : "PENDENTE";

    await prisma.$transaction(async (tx) => {
      await this.vendaRepo.addPagamentosWithTx(tx, id_venda, data.pagamentos);

      await this.vendaRepo.updateValorPagoWithTx(
        tx,
        id_venda,
        novoValorPago.toNumber()
      );

      if (deveFinalizar) {
        await this.vendaRepo.updateStatusWithTx(tx, id_venda, "FINALIZADA");

        // ✅ CORREÇÃO: Mudamos de venda.item_venda para venda.itens
        for (const item of venda.itens) {
          await this.auxRepo.decrementStock(
            tx,
            item.id_variacao,
            item.quantidade
          );
        }

        if (venda.id_caixa) {
          await this.auxRepo.createMovimentacao(tx, {
            id_loja: venda.id_loja,
            id_caixa: venda.id_caixa,
            id_venda: venda.id_venda,
            tipo: "ENTRADA",
            valor: novosPagamentosTotal.toNumber(),
            descricao: `Pagamento Adicional Venda #${venda.id_venda.substring(
              0,
              8
            )}`,
          });
        }
      }
    });

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Adicionar Pagamento",
      detalhes: `Venda ${id_venda} - Valor Add: ${novosPagamentosTotal.toNumber()} - Status: ${novoStatus}`,
    });

    return this.vendaRepo.findById(id_venda);
  }
}
