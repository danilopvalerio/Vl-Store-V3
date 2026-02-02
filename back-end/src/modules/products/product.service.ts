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

export class ProductService {
  constructor(
    private repo: IProductRepository,
    private logService: LogService,
  ) {}

  // --- PRODUTOS ---

  async createProduct(data: CreateProductDTO): Promise<ProductEntity> {
    const existingProduct = await this.repo.findByReferencia(
      data.referencia,
      data.id_loja,
    );
    if (existingProduct)
      throw new AppError(`Referência '${data.referencia}' já existe.`, 409);

    const product = await this.repo.create(data);
    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Criar Produto",
      detalhes: `ID: ${product.id_produto}`,
    });
    return product;
  }

  async updateProduct(
    id: string,
    data: UpdateProductDTO,
  ): Promise<ProductEntity> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Produto não encontrado.", 404);

    const updated = await this.repo.update(id, data);
    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Atualizar Produto",
      detalhes: `ID: ${id}`,
    });
    return updated;
  }

  async deleteProduct(id: string, actorUserId: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Produto não encontrado.", 404);

    await this.repo.delete(id);
    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Produto",
      detalhes: `ID: ${id}`,
    });
  }

  async getProductById(id: string): Promise<ProductEntity> {
    const product = await this.repo.findById(id);
    if (!product) throw new AppError("Produto não encontrado", 404);
    return product;
  }

  // ATUALIZADO: Aceita orderBy (4 parâmetros)
  async getProductsPaginated(
    page: number,
    limit: number,
    lojaId?: string,
    orderBy?: string,
  ) {
    const { data, total } = await this.repo.findPaginated(
      page,
      limit,
      lojaId,
      orderBy,
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // ATUALIZADO: Aceita orderBy (5 parâmetros)
  async searchProducts(
    term: string,
    page: number,
    limit: number,
    lojaId?: string,
    orderBy?: string,
  ) {
    const { data, total } = await this.repo.searchPaginated(
      term,
      page,
      limit,
      lojaId,
      orderBy,
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // --- VARIAÇÕES ---

  async createVariation(data: CreateVariationDTO): Promise<VariationEntity> {
    const produtoPai = await this.repo.findById(data.id_produto);
    if (!produtoPai) throw new AppError("Produto pai não encontrado.", 404);

    const variation = await this.repo.createVariation(data);
    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Criar Variação",
      detalhes: `Nova variação no produto ${produtoPai.nome}`,
    });
    return variation;
  }

  // ATUALIZADO AQUI
  async updateVariation(
    id: string,
    data: UpdateVariationDTO,
  ): Promise<VariationEntity> {
    const existing = await this.repo.findVariationById(id);
    if (!existing) throw new AppError("Variação não encontrada.", 404);

    // O repositório já tem a lógica de comparar o que existe com o kept_images.
    // Só precisamos garantir que 'data' contenha 'kept_images'.
    const updated = await this.repo.updateVariation(id, data);

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Atualizar Variação",
      detalhes: `ID: ${id}`,
    });
    return updated;
  }

  async deleteVariation(id: string, actorUserId: string): Promise<void> {
    const existing = await this.repo.findVariationById(id);
    if (!existing) throw new AppError("Variação não encontrada.", 404);

    await this.repo.deleteVariation(id);
    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Variação",
      detalhes: `ID: ${id}`,
    });
  }

  async getVariationById(id: string): Promise<VariationEntity> {
    const variation = await this.repo.findVariationById(id);
    if (!variation) throw new AppError("Variação não encontrada", 404);
    return variation;
  }

  async getVariationsPaginated(page: number, limit: number, lojaId?: string) {
    const { data, total } = await this.repo.findVariationsPaginated(
      page,
      limit,
      lojaId,
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async searchVariations(
    term: string,
    page: number,
    limit: number,
    lojaId?: string,
  ) {
    const { data, total } = await this.repo.searchVariations(
      term,
      page,
      limit,
      lojaId,
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async getPaginatedVariationsByProduct(
    productId: string,
    page: number,
    limit: number,
  ) {
    const { data, total } = await this.repo.findVariationsByProduct(
      productId,
      page,
      limit,
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async searchPaginatedVariationsByProduct(
    productId: string,
    term: string,
    page: number,
    limit: number,
  ) {
    const { data, total } = await this.repo.searchVariationsByProduct(
      productId,
      term,
      page,
      limit,
    );
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }
}
