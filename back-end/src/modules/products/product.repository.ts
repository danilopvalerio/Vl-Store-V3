import { prisma } from "../../shared/database/prisma";
import {
  IProductRepository,
  ProductEntity,
  VariationEntity,
  CreateProductDTO,
  UpdateProductDTO,
  ProductListingDTO,
  CreateVariationDTO,
  UpdateVariationDTO,
} from "./product.dto";
import {
  Prisma,
  produto,
  produto_variacao,
} from "../../shared/database/generated/prisma/client";

// Tipos auxiliares
type ProductRaw = produto;
type VariationRaw = produto_variacao;

type ProductWithVariationsRaw = Prisma.produtoGetPayload<{
  include: {
    produto_variacao: {
      select: { quantidade: true; valor: true };
    };
  };
}>;

export class ProductRepository implements IProductRepository {
  // ==========================================================================
  // MAPPERS
  // ==========================================================================

  private mapToProductEntity(p: ProductRaw): ProductEntity {
    return {
      id_produto: p.id_produto,
      id_loja: p.id_loja,
      referencia: p.referencia,
      nome: p.nome,
      categoria: p.categoria,
      material: p.material,
      genero: p.genero,
      ativo: p.ativo,
      data_criacao: p.data_criacao,
      ultima_atualizacao: p.ultima_atualizacao,
    };
  }

  private mapToVariationEntity(v: VariationRaw): VariationEntity {
    return {
      id_variacao: v.id_variacao,
      id_produto: v.id_produto,
      nome: v.nome,
      descricao: v.descricao,
      quantidade: v.quantidade,
      valor: Number(v.valor),
      data_criacao: v.data_criacao,
      ultima_atualizacao: v.ultima_atualizacao,
    };
  }

  private processProductListing(
    productsRaw: ProductWithVariationsRaw[]
  ): ProductListingDTO[] {
    return productsRaw.map((product) => {
      const variacoes = product.produto_variacao || [];

      const totalEstoque = variacoes.reduce(
        (acc, item) => acc + (item.quantidade ?? 0),
        0
      );
      const qtdVariacoes = variacoes.length;

      let menorValor = 0;
      if (variacoes.length > 0) {
        const precos = variacoes.map((v) => Number(v.valor));
        menorValor = Math.min(...precos);
      }

      const { produto_variacao: _produto_variacao, ...baseData } = product;

      return {
        ...this.mapToProductEntity(baseData as ProductRaw),
        total_estoque: totalEstoque,
        qtd_variacoes: qtdVariacoes,
        menor_valor: menorValor,
      };
    });
  }

  // ==========================================================================
  // IMPLEMENTAÇÃO DO IBASE REPOSITORY (PRODUTOS)
  // ==========================================================================

  // createProduct -> create
  async create(data: CreateProductDTO): Promise<ProductEntity> {
    const product = await prisma.produto.create({
      data: {
        id_loja: data.id_loja,
        nome: data.nome,
        referencia: data.referencia,
        categoria: data.categoria,
        material: data.material,
        genero: data.genero,
        ativo: true,
      },
    });
    return this.mapToProductEntity(product);
  }

  // updateProduct -> update
  async update(id: string, data: UpdateProductDTO): Promise<ProductEntity> {
    const product = await prisma.produto.update({
      where: { id_produto: id },
      data: {
        nome: data.nome,
        referencia: data.referencia,
        categoria: data.categoria,
        material: data.material,
        genero: data.genero,
        ativo: data.ativo,
        ultima_atualizacao: new Date(),
      },
    });
    return this.mapToProductEntity(product);
  }

  // deleteProduct -> delete
  async delete(id: string): Promise<void> {
    await prisma.produto.delete({ where: { id_produto: id } });
  }

  // findProductById -> findById
  async findById(id: string): Promise<ProductEntity | null> {
    const product = await prisma.produto.findUnique({
      where: { id_produto: id },
    });
    return product ? this.mapToProductEntity(product) : null;
  }

  // Novo método exigido pelo IBaseRepository (findAll)
  async findAll(): Promise<ProductEntity[]> {
    const products = await prisma.produto.findMany();
    return products.map((p) => this.mapToProductEntity(p));
  }

  // ==========================================================================
  // LISTAGENS DE PRODUTO (Customizadas com Paginação)
  // ==========================================================================

  // findProductsPaginated -> findPaginated
  // TypeScript permite adicionar argumentos opcionais (lojaId) na implementação
  async findPaginated(
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: ProductListingDTO[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.produtoWhereInput = lojaId ? { id_loja: lojaId } : {};

    const [dataRaw, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        take: limit,
        skip,
        orderBy: { nome: "asc" },
        include: {
          produto_variacao: {
            select: { quantidade: true, valor: true },
          },
        },
      }),
      prisma.produto.count({ where }),
    ]);

    return { data: this.processProductListing(dataRaw), total };
  }

  // searchProducts -> searchPaginated
  async searchPaginated(
    query: string,
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: ProductListingDTO[]; total: number }> {
    const skip = (page - 1) * limit;

    const searchCondition: Prisma.produtoWhereInput = {
      OR: [
        { nome: { contains: query, mode: "insensitive" } },
        { referencia: { contains: query, mode: "insensitive" } },
        { categoria: { contains: query, mode: "insensitive" } },
      ],
    };

    const where: Prisma.produtoWhereInput = lojaId
      ? { AND: [{ id_loja: lojaId }, searchCondition] }
      : searchCondition;

    const [dataRaw, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        take: limit,
        skip,
        orderBy: { nome: "asc" },
        include: {
          produto_variacao: {
            select: { quantidade: true, valor: true },
          },
        },
      }),
      prisma.produto.count({ where }),
    ]);

    return { data: this.processProductListing(dataRaw), total };
  }

  // ==========================================================================
  // VARIAÇÕES (Mantidos nomes específicos)
  // ==========================================================================

  async createVariation(data: CreateVariationDTO): Promise<VariationEntity> {
    const variation = await prisma.produto_variacao.create({
      data: {
        id_produto: data.id_produto,
        nome: data.nome,
        descricao: data.descricao,
        quantidade: data.quantidade,
        valor: data.valor,
      },
    });
    return this.mapToVariationEntity(variation);
  }

  async updateVariation(
    id: string,
    data: UpdateVariationDTO
  ): Promise<VariationEntity> {
    const variation = await prisma.produto_variacao.update({
      where: { id_variacao: id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        quantidade: data.quantidade,
        valor: data.valor,
        ultima_atualizacao: new Date(),
      },
    });
    return this.mapToVariationEntity(variation);
  }

  async deleteVariation(id: string): Promise<void> {
    await prisma.produto_variacao.delete({ where: { id_variacao: id } });
  }

  async findVariationById(id: string): Promise<VariationEntity | null> {
    const variation = await prisma.produto_variacao.findUnique({
      where: { id_variacao: id },
    });
    return variation ? this.mapToVariationEntity(variation) : null;
  }

  async findVariationsPaginated(
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: VariationEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.produto_variacaoWhereInput = {};
    if (lojaId) {
      where.produto = { id_loja: lojaId };
    }

    const [data, total] = await Promise.all([
      prisma.produto_variacao.findMany({
        where,
        take: limit,
        skip,
        orderBy: { nome: "asc" },
      }),
      prisma.produto_variacao.count({ where }),
    ]);

    return { data: data.map((v) => this.mapToVariationEntity(v)), total };
  }

  async searchVariations(
    query: string,
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: VariationEntity[]; total: number }> {
    const skip = (page - 1) * limit;

    const searchCondition: Prisma.produto_variacaoWhereInput = {
      OR: [
        { nome: { contains: query, mode: "insensitive" } },
        { produto: { nome: { contains: query, mode: "insensitive" } } },
        { produto: { referencia: { contains: query, mode: "insensitive" } } },
      ],
    };

    const where: Prisma.produto_variacaoWhereInput = lojaId
      ? { AND: [{ produto: { id_loja: lojaId } }, searchCondition] }
      : searchCondition;

    const [data, total] = await Promise.all([
      prisma.produto_variacao.findMany({
        where,
        take: limit,
        skip,
        orderBy: { nome: "asc" },
      }),
      prisma.produto_variacao.count({ where }),
    ]);

    return { data: data.map((v) => this.mapToVariationEntity(v)), total };
  }

  async findVariationsByProduct(
    productId: string,
    page: number,
    limit: number
  ): Promise<{ data: VariationEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.produto_variacaoWhereInput = { id_produto: productId };

    const [data, total] = await Promise.all([
      prisma.produto_variacao.findMany({
        where,
        take: limit,
        skip,
        orderBy: { nome: "asc" },
      }),
      prisma.produto_variacao.count({ where }),
    ]);

    return { data: data.map((v) => this.mapToVariationEntity(v)), total };
  }

  async searchVariationsByProduct(
    productId: string,
    query: string,
    page: number,
    limit: number
  ): Promise<{ data: VariationEntity[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.produto_variacaoWhereInput = {
      AND: [
        { id_produto: productId },
        {
          OR: [
            { nome: { contains: query, mode: "insensitive" } },
            { produto: { nome: { contains: query, mode: "insensitive" } } },
          ],
        },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.produto_variacao.findMany({
        where,
        take: limit,
        skip,
        orderBy: { nome: "asc" },
      }),
      prisma.produto_variacao.count({ where }),
    ]);

    return { data: data.map((v) => this.mapToVariationEntity(v)), total };
  }
}
