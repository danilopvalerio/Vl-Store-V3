import {
  IProductRepository,
  CreateProductDTO,
  UpdateProductDTO,
  CreateVariationDTO,
  UpdateVariationDTO,
  ProductEntity,
  VariationEntity,
} from "./product.dto";
import { AppError } from "../../app/middleware/error.middleware";
import { LogService } from "../logs/log.service";
import { isValidUUID, isValidString } from "../../shared/utils/validation";
import { Prisma } from "../../shared/database/generated/prisma/client";

export class ProductService {
  constructor(
    private repo: IProductRepository,
    private logService: LogService
  ) {}

  // ==========================================================================
  // PRODUTOS
  // ==========================================================================

  async createProduct(data: CreateProductDTO): Promise<ProductEntity> {
    if (!isValidUUID(data.id_loja)) throw new AppError("Loja inválida.");
    if (!isValidString(data.nome)) throw new AppError("Nome obrigatório.");

    try {
      const product = await this.repo.create(data);

      await this.logService.logSystem({
        id_user: data.actorUserId,
        acao: "Criar Produto",
        detalhes: `Produto '${product.nome}' criado com ID: ${product.id_produto}.`,
      });

      return product;
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const target = err.meta?.target as string[];
        if (target?.includes("referencia")) {
          throw new AppError(
            `A referência '${data.referencia}' já está sendo usada por outro produto.`,
            409
          );
        }
      }
      throw err; // Relança para o erro 500 genérico se não for P2002
    }
  }

  async updateProduct(
    id: string,
    data: UpdateProductDTO
  ): Promise<ProductEntity> {
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Produto não encontrado.", 404);

    try {
      const updated = await this.repo.update(id, data);

      await this.logService.logSystem({
        id_user: data.actorUserId,
        acao: "Atualizar Produto",
        detalhes: `Produto '${existing.nome}' (ID: ${id}) atualizado.`,
      });

      return updated;
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const target = err.meta?.target as string[];
        if (target?.includes("referencia")) {
          throw new AppError(
            `A referência '${data.referencia}' já está sendo usada por outro produto.`,
            409
          );
        }
      }
      throw err;
    }
  }

  async deleteProduct(id: string, actorUserId: string): Promise<void> {
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Produto não encontrado.", 404);

    await this.repo.delete(id);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Produto",
      detalhes: `Produto '${existing.nome}' (ID: ${id}) removido.`,
    });
  }

  async getProductById(id: string): Promise<ProductEntity> {
    if (!isValidUUID(id)) throw new AppError("ID inválido.");
    const product = await this.repo.findById(id);
    if (!product) throw new AppError("Produto não encontrado", 404);
    return product;
  }

  async getProductsPaginated(page: number, limit: number, lojaId?: string) {
    const { data, total } = await this.repo.findPaginated(page, limit, lojaId);
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async searchProducts(
    term: string,
    page: number,
    limit: number,
    lojaId?: string
  ) {
    const { data, total } = await this.repo.searchPaginated(
      term,
      page,
      limit,
      lojaId
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // ==========================================================================
  // VARIAÇÕES
  // ==========================================================================

  async createVariation(data: CreateVariationDTO): Promise<VariationEntity> {
    if (!isValidUUID(data.id_produto)) throw new AppError("Produto inválido.");
    if (!isValidString(data.nome)) throw new AppError("Nome obrigatório.");
    if (data.quantidade < 0) throw new AppError("Quantidade inválida.");
    if (data.valor < 0) throw new AppError("Valor inválido.");

    const produtoPai = await this.repo.findById(data.id_produto);
    if (!produtoPai) throw new AppError("Produto pai não encontrado.", 404);

    const variation = await this.repo.createVariation(data);

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Criar Variação",
      detalhes: `Variação '${variation.nome}' adicionada ao produto '${produtoPai.nome}'.`,
    });

    return variation;
  }

  async updateVariation(
    id: string,
    data: UpdateVariationDTO
  ): Promise<VariationEntity> {
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    const existing = await this.repo.findVariationById(id);
    if (!existing) throw new AppError("Variação não encontrada.", 404);

    const updated = await this.repo.updateVariation(id, data);

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Atualizar Variação",
      detalhes: `Variação '${existing.nome}' (ID: ${id}) atualizada.`,
    });

    return updated;
  }

  async deleteVariation(id: string, actorUserId: string): Promise<void> {
    if (!isValidUUID(id)) throw new AppError("ID inválido.");

    const existing = await this.repo.findVariationById(id);
    if (!existing) throw new AppError("Variação não encontrada.", 404);

    await this.repo.deleteVariation(id);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Variação",
      detalhes: `Variação '${existing.nome}' (ID: ${id}) removida.`,
    });
  }

  async getVariationById(id: string): Promise<VariationEntity> {
    if (!isValidUUID(id)) throw new AppError("ID inválido.");
    const variation = await this.repo.findVariationById(id);
    if (!variation) throw new AppError("Variação não encontrada", 404);
    return variation;
  }

  async getVariationsPaginated(page: number, limit: number, lojaId?: string) {
    const { data, total } = await this.repo.findVariationsPaginated(
      page,
      limit,
      lojaId
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async searchVariations(
    term: string,
    page: number,
    limit: number,
    lojaId?: string
  ) {
    const { data, total } = await this.repo.searchVariations(
      term,
      page,
      limit,
      lojaId
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async getPaginatedVariationsByProduct(
    productId: string,
    page: number,
    limit: number
  ) {
    const { data, total } = await this.repo.findVariationsByProduct(
      productId,
      page,
      limit
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async searchPaginatedVariationsByProduct(
    productId: string,
    term: string,
    page: number,
    limit: number
  ) {
    const { data, total } = await this.repo.searchVariationsByProduct(
      productId,
      term,
      page,
      limit
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }
}
