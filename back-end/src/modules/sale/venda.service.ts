//src/modules/sale/venda.service.ts
import { prisma } from "../../shared/database/prisma";
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
    // 1. Validações
    if (!isValidUUID(data.id_loja)) throw new AppError("Loja inválida");
    if (data.itens.length === 0) throw new AppError("A venda deve ter itens");

    // 2. Leitura de Preço e Estoque (Fora da transação para não travar leitura)
    const variacaoIds = data.itens.map((i) => i.id_variacao);

    // Busca apenas o necessário: ID, Quantidade, Valor e Nome
    const dbVariacoes = await prisma.produto_variacao.findMany({
      where: { id_variacao: { in: variacaoIds } },
      select: { id_variacao: true, quantidade: true, valor: true, nome: true },
    });

    let totalItens = 0;
    const itensFinal: PreparedItemVenda[] = [];

    for (const itemInput of data.itens) {
      const variacao = dbVariacoes.find(
        (v) => v.id_variacao === itemInput.id_variacao
      );
      if (!variacao)
        throw new AppError(
          `Variação ${itemInput.id_variacao} não encontrada`,
          404
        );

      const estoqueAtual = variacao.quantidade ?? 0;
      if (estoqueAtual < itemInput.quantidade) {
        throw new AppError(
          `Estoque insuficiente para ${
            variacao.nome || "Produto"
          }. Disp: ${estoqueAtual}`
        );
      }

      // Converte Decimal para Number
      const precoBase =
        itemInput.preco_unitario_override ?? Number(variacao.valor);

      const desconto = itemInput.desconto_por_item || 0;
      const acrescimo = itemInput.acrescimo_por_item || 0;
      const precoFinal = precoBase - desconto + acrescimo;
      const subtotal = precoFinal * itemInput.quantidade;

      totalItens += subtotal;

      itensFinal.push({
        id_variacao: itemInput.id_variacao,
        quantidade: itemInput.quantidade,
        preco_unitario: precoBase,
        desconto_por_item: desconto,
        acrescimo_por_item: acrescimo,
        preco_final_unitario: precoFinal,
        preco_subtotal: subtotal,
      });
    }

    const totalFinalVenda =
      totalItens - (data.desconto_global || 0) + (data.acrescimo_global || 0);
    const totalPago = data.pagamentos.reduce((acc, p) => acc + p.valor, 0);

    if (data.status === "FINALIZADA" && totalPago < totalFinalVenda) {
      throw new AppError("Valor pago insuficiente para finalizar venda");
    }

    // 3. Transação
    const vendaId = await prisma.$transaction(async (tx) => {
      // A. Criar Cabeçalho da Venda
      const venda = await this.vendaRepo.createWithTx(
        tx,
        data,
        totalFinalVenda
      );

      // B. Inserir Itens
      await this.itemRepo.createManyWithTx(tx, venda.id_venda, itensFinal);

      // C. Baixar Estoque
      for (const item of itensFinal) {
        await this.auxRepo.decrementStock(
          tx,
          item.id_variacao,
          item.quantidade
        );
      }

      // D. Movimentação Financeira
      if (data.id_caixa && data.status === "FINALIZADA") {
        const caixa = await tx.caixa.findUnique({
          where: { id_caixa: data.id_caixa },
        });
        if (
          !caixa ||
          (caixa.status !== "ABERTO" && caixa.status !== "REABERTO")
        ) {
          throw new AppError("Caixa fechado ou inválido.", 409);
        }
        await this.auxRepo.createMovimentacao(tx, {
          id_loja: data.id_loja,
          id_caixa: data.id_caixa,
          id_venda: venda.id_venda,
          tipo: "ENTRADA",
          valor: totalPago,
          descricao: `Venda #${venda.id_venda.substring(0, 8)}`,
        });
      }
      return venda.id_venda;
    });

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Criar Venda",
      detalhes: `Venda ${vendaId} criada.`,
    });

    const result = await this.vendaRepo.findById(vendaId);
    if (!result) throw new AppError("Erro ao recuperar venda criada", 500);
    return result;
  }

  async getItensPaginated(idVenda: string, page: number, limit: number) {
    // Verifica se a venda existe antes
    const venda = await this.vendaRepo.findById(idVenda);
    if (!venda) throw new AppError("Venda não encontrada", 404);

    const { data, total } = await this.itemRepo.findPaginated(
      page,
      limit,
      idVenda
    );

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async mudarStatus(idVenda: string, data: UpdateStatusDTO) {
    const venda = await this.vendaRepo.findById(idVenda);
    if (!venda) throw new AppError("Venda não encontrada", 404);

    if (data.status === "CANCELADA") {
      if (venda.status === "CANCELADA")
        throw new AppError("Venda já está cancelada", 400);

      await prisma.$transaction(async (tx) => {
        await this.vendaRepo.updateStatusWithTx(tx, idVenda, "CANCELADA");

        // Estorna estoque (Devolve os itens)
        for (const item of venda.itens) {
          await this.auxRepo.incrementStock(
            tx,
            item.id_variacao,
            item.quantidade
          );
        }

        // Estorna caixa (Gera SAIDA) se a venda original gerou ENTRADA
        if (venda.id_caixa) {
          const caixa = await tx.caixa.findUnique({
            where: { id_caixa: venda.id_caixa },
          });
          // Só mexe no caixa se ele ainda estiver "ativo". Se fechado, o sistema não mexe.
          if (
            caixa &&
            (caixa.status === "ABERTO" || caixa.status === "REABERTO")
          ) {
            await this.auxRepo.createMovimentacao(tx, {
              id_loja: venda.id_loja,
              id_caixa: venda.id_caixa,
              id_venda: venda.id_venda,
              tipo: "SAIDA",
              valor: venda.valor_pago,
              descricao: `Estorno Venda #${venda.id_venda.substring(0, 8)}`,
            });
          }
        }
      });
    } else {
      // Outros status (PENDENTE -> FINALIZADA)
      // Obs: Simplificado. Idealmente ao finalizar uma pendente deveria baixar estoque se não baixou antes.
      await this.vendaRepo.updateStatus(idVenda, data.status);
    }

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Atualizar Status Venda",
      detalhes: `Venda ${idVenda} para ${data.status}`,
    });
  }

  async getById(id: string) {
    const res = await this.vendaRepo.findById(id);
    if (!res) throw new AppError("Venda não encontrada", 404);
    return res;
  }

  async getPaginated(page: number, limit: number, lojaId?: string) {
    const { data, total } = await this.vendaRepo.findPaginated(
      page,
      limit,
      lojaId
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async searchPaginated(
    term: string,
    page: number,
    limit: number,
    lojaId?: string
  ) {
    const { data, total } = await this.vendaRepo.searchPaginated(
      term,
      page,
      limit,
      lojaId
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }
}
