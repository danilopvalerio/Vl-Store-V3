// src/services/product.service.ts
import { Prisma } from "../generated/prisma/client"; // Importa os tipos gerados
import { ProductRepository } from "../repositories/product.repository";
import { LogService } from "./log.service";
import {
  CreateProductDTO,
  UpdateProductDTO,
  CreateVariationDTO,
  UpdateVariationDTO,
} from "../dtos/product.dto";

export class ProductService {
  private repo = new ProductRepository();
  private logService = new LogService();

  // ============================================================================
  // GESTÃO DE PRODUTOS (PAI)
  // ============================================================================

  async createProduct(data: CreateProductDTO, actorUserId: string) {
    try {
      const product = await this.repo.createProduct({
        id_loja: data.id_loja,
        nome: data.nome,
        referencia: data.referencia,
        categoria: data.categoria,
        material: data.material,
        genero: data.genero,
        ativo: true,
      });

      await this.logService.logSystem({
        id_user: actorUserId,
        acao: "Criar Produto",
        detalhes: `Produto '${product.nome}' criado com ID: ${product.id_produto}.`,
      });

      return product;
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (err.meta?.target as string[])?.includes("referencia")
      ) {
        throw new Error(
          `A referência '${data.referencia}' já está sendo usada por outro produto.`
        );
      }
      throw err;
    }
  }

  async getPaginatedVariationsByProduct(
    productId: string,
    page: number,
    perPage: number
  ) {
    return this.repo.findVariationsPaginatedByProduct(productId, page, perPage);
  }

  async searchPaginatedVariationsByProduct(
    productId: string,
    term: string,
    page: number,
    perPage: number
  ) {
    return this.repo.searchVariationsByProduct(productId, term, page, perPage);
  }

  async updateProduct(id: string, data: UpdateProductDTO, actorUserId: string) {
    const existing = await this.repo.findProductById(id);
    if (!existing) throw new Error("Produto não encontrado.");

    try {
      const updateData: Prisma.produtoUpdateInput = {};
      const mudancas: string[] = [];
      let novoNomeParaLog: string | undefined;

      if (
        data.referencia !== undefined &&
        data.referencia !== existing.referencia
      ) {
        updateData.referencia = data.referencia;
        mudancas.push(
          `Referência alterada de '${existing.referencia}' para '${data.referencia}'`
        );
      }

      if (data.nome && data.nome !== existing.nome) {
        updateData.nome = data.nome;
        mudancas.push(
          `Nome alterado de '${existing.nome}' para '${data.nome}'`
        );
        novoNomeParaLog = data.nome;
      }

      if (
        data.categoria !== undefined &&
        data.categoria !== existing.categoria
      ) {
        updateData.categoria = data.categoria;
        mudancas.push(
          `Categoria alterada de '${existing.categoria}' para '${data.categoria}'`
        );
      }

      if (data.genero !== undefined && data.genero !== existing.genero) {
        updateData.genero = data.genero;
        mudancas.push(
          `Gênero alterado de '${existing.genero}' para '${data.genero}'`
        );
      }

      if (data.ativo !== undefined && data.ativo !== existing.ativo) {
        updateData.ativo = data.ativo;
        mudancas.push(`Produto ${data.ativo ? "ativado" : "desativado"}`);
      }

      // Se não houve mudanças, retorna o existente sem chamar o banco
      if (Object.keys(updateData).length === 0) return existing;

      const updated = await this.repo.updateProduct(id, updateData);

      if (mudancas.length > 0) {
        const nomeLog = novoNomeParaLog || existing.nome;
        await this.logService.logSystem({
          id_user: actorUserId,
          acao: "Atualizar Produto",
          detalhes: `Produto '${nomeLog}' atualizado. ${mudancas.join(". ")}.`,
        });
      }

      return updated;
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (err.meta?.target as string[])?.includes("referencia")
      ) {
        throw new Error(
          `A referência '${data.referencia}' já está cadastrada em outro produto.`
        );
      }
      throw err;
    }
  }

  async deleteProduct(id: string, actorUserId: string) {
    const existing = await this.repo.findProductById(id);
    if (!existing) throw new Error("Produto não encontrado.");

    await this.repo.deleteProduct(id);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Produto",
      detalhes: `Produto '${existing.nome}' (ID: ${id}) e suas variações foram removidos.`,
    });
  }

  // ============================================================================
  // GESTÃO DE VARIAÇÕES (FILHO)
  // ============================================================================

  async createVariation(data: CreateVariationDTO, actorUserId: string) {
    const produtoPai = await this.repo.findProductById(data.id_produto);
    if (!produtoPai) throw new Error("Produto pai não encontrado.");

    const variation = await this.repo.createVariation({
      id_produto: data.id_produto,
      nome: data.nome,
      descricao: data.descricao,
      quantidade: data.quantidade,
      valor: data.valor,
    });

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Criar Variação",
      detalhes: `Variação '${variation.nome}' adicionada ao produto '${produtoPai.nome}'. Qtd: ${variation.quantidade}, Valor: ${variation.valor}.`,
    });

    return variation;
  }

  async updateVariation(
    id: string,
    data: UpdateVariationDTO,
    actorUserId: string
  ) {
    const existing = await this.repo.findVariationById(id);
    if (!existing) throw new Error("Variação não encontrada.");

    // Tipagem estrita do Prisma para variação
    const updateData: Prisma.produto_variacaoUpdateInput = {};
    const mudancas: string[] = [];

    if (data.nome && data.nome !== existing.nome) {
      updateData.nome = data.nome;
      mudancas.push(`Nome alterado para '${data.nome}'`);
    }

    if (
      data.quantidade !== undefined &&
      data.quantidade !== existing.quantidade
    ) {
      updateData.quantidade = data.quantidade;
      mudancas.push(
        `Estoque alterado de ${existing.quantidade} para ${data.quantidade}`
      );
    }

    if (
      data.valor !== undefined &&
      Number(data.valor) !== Number(existing.valor)
    ) {
      updateData.valor = data.valor;
      mudancas.push(`Preço alterado de ${existing.valor} para ${data.valor}`);
    }

    if (Object.keys(updateData).length === 0) return existing;

    const updated = await this.repo.updateVariation(id, updateData);

    if (mudancas.length > 0) {
      await this.logService.logSystem({
        id_user: actorUserId,
        acao: "Atualizar Variação",
        detalhes: `Variação '${existing.nome}' (Produto: ${
          updated.produto?.nome
        }). Alterações: ${mudancas.join(". ")}.`,
      });
    }

    return updated;
  }

  async deleteVariation(id: string, actorUserId: string) {
    const existing = await this.repo.findVariationById(id);
    if (!existing) throw new Error("Variação não encontrada.");

    await this.repo.deleteVariation(id);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Variação",
      detalhes: `Variação '${existing.nome}' removida do produto '${existing.produto?.nome}'.`,
    });
  }

  // ============================================================================
  // LEITURAS
  // ============================================================================

  async getProductById(id: string) {
    return this.repo.findProductById(id);
  }

  async getProductsPaginated(page = 1, perPage = 10, lojaId?: string) {
    return this.repo.findProductsPaginated(page, perPage, lojaId);
  }

  async searchProducts(term: string, page = 1, perPage = 10, lojaId?: string) {
    return this.repo.searchProducts(term, page, perPage, lojaId);
  }

  async getVariationById(id: string) {
    return this.repo.findVariationById(id);
  }

  async getVariationsPaginated(page = 1, perPage = 10, lojaId?: string) {
    return this.repo.findVariationsPaginated(page, perPage, lojaId);
  }

  async searchVariations(
    term: string,
    page = 1,
    perPage = 10,
    lojaId?: string
  ) {
    return this.repo.searchVariations(term, page, perPage, lojaId);
  }
}
