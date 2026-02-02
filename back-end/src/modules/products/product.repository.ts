import { prisma } from "../../shared/database/prisma";
import Decimal from "decimal.js";
import { randomUUID } from "node:crypto";
import fs from "fs";
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

// Tipos básicos
type ProductRaw = produto;
type VariationRaw = produto_variacao;

type ProductWithCoverRaw = Prisma.produtoGetPayload<{
  include: {
    produto_variacao: {
      select: {
        quantidade: true;
        valor: true;
        imagem_variacao: {
          select: { caminho: true; principal: true };
          take: 1;
        };
      };
    };
  };
}>;

type VariationWithImagesRaw = Prisma.produto_variacaoGetPayload<{
  include: { imagem_variacao: true };
}>;

export class ProductRepository implements IProductRepository {
  // --- HELPER ---
  private deleteFilesFromDisk(caminhoPrincipal: string) {
    if (!caminhoPrincipal) return;
    const filesToDelete = [
      caminhoPrincipal,
      caminhoPrincipal.replace("-lg.", "-md."),
      caminhoPrincipal.replace("-lg.", "-thumb."),
    ];
    filesToDelete.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Erro ao deletar arquivo: ${filePath}`, err);
        }
      }
    });
  }

  // --- MAPPERS ---
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

  private mapToVariationEntity(
    v: VariationRaw | VariationWithImagesRaw,
  ): VariationEntity {
    const rawImages =
      "imagem_variacao" in v
        ? (v as VariationWithImagesRaw).imagem_variacao
        : [];

    const imagensMapped = rawImages.map((img) => ({
      id_imagem: img.id_imagem,
      caminho: `/uploads/produtos/${img.caminho.split(/[\\/]/).pop()}`,
      principal: img.principal || false,
    }));

    return {
      id_variacao: v.id_variacao,
      id_produto: v.id_produto,
      nome: v.nome,
      descricao: v.descricao,
      quantidade: v.quantidade,
      valor: new Decimal(v.valor?.toString() || 0).toNumber(),
      imagens: imagensMapped,
      data_criacao: v.data_criacao,
      ultima_atualizacao: v.ultima_atualizacao,
    };
  }

  private processProductListing(
    productsRaw: ProductWithCoverRaw[],
  ): ProductListingDTO[] {
    return productsRaw.map((product) => {
      const variacoes = product.produto_variacao || [];
      const totalEstoque = variacoes.reduce(
        (acc, item) => acc + (item.quantidade ?? 0),
        0,
      );
      const qtdVariacoes = variacoes.length;

      let menorValor = 0;
      if (variacoes.length > 0) {
        const precos = variacoes.map((v) =>
          new Decimal(v.valor?.toString() || 0).toNumber(),
        );
        menorValor = Math.min(...precos);
      }

      let imagemCapa: string | null = null;
      const variacaoComImagem = variacoes.find(
        (v) => v.imagem_variacao && v.imagem_variacao.length > 0,
      );

      if (variacaoComImagem) {
        const img =
          variacaoComImagem.imagem_variacao.find((i) => i.principal) ||
          variacaoComImagem.imagem_variacao[0];

        if (img && img.caminho) {
          const nomeArquivo = img.caminho.split(/[\\/]/).pop();
          if (nomeArquivo) {
            const nomeThumb = nomeArquivo.replace("-lg.", "-thumb.");
            imagemCapa = `/uploads/produtos/${nomeThumb}`;
          }
        }
      }

      const { produto_variacao: _unused, ...baseData } = product;

      return {
        ...this.mapToProductEntity(baseData as ProductRaw),
        total_estoque: totalEstoque,
        qtd_variacoes: qtdVariacoes,
        menor_valor: menorValor,
        imagem_capa: imagemCapa,
      };
    });
  }

  // --- CRUD PRODUTOS ---
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

  async delete(id: string): Promise<void> {
    const productToDelete = await prisma.produto.findUnique({
      where: { id_produto: id },
      include: {
        produto_variacao: { include: { imagem_variacao: true } },
      },
    });

    if (productToDelete && productToDelete.produto_variacao) {
      for (const variacao of productToDelete.produto_variacao) {
        if (variacao.imagem_variacao) {
          for (const img of variacao.imagem_variacao) {
            this.deleteFilesFromDisk(img.caminho);
          }
        }
      }
    }
    await prisma.produto.delete({ where: { id_produto: id } });
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const product = await prisma.produto.findUnique({
      where: { id_produto: id },
    });
    return product ? this.mapToProductEntity(product) : null;
  }

  async findAll(): Promise<ProductEntity[]> {
    const products = await prisma.produto.findMany();
    return products.map((p) => this.mapToProductEntity(p));
  }

  async findByReferencia(
    referencia: string,
    lojaId: string,
  ): Promise<ProductEntity | null> {
    const product = await prisma.produto.findFirst({
      where: { referencia, id_loja: lojaId },
    });
    return product ? this.mapToProductEntity(product) : null;
  }

  // --- LISTAGEM OTIMIZADA COM ORDENAÇÃO ---

  async findPaginated(
    page: number,
    limit: number,
    lojaId?: string,
    orderBy?: string,
  ): Promise<{ data: ProductListingDTO[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.produtoWhereInput = lojaId ? { id_loja: lojaId } : {};

    let prismaOrderBy: Prisma.produtoOrderByWithRelationInput | undefined;
    switch (orderBy) {
      case "name_asc":
        prismaOrderBy = { nome: "asc" };
        break;
      case "name_desc":
        prismaOrderBy = { nome: "desc" };
        break;
      case "newest":
        prismaOrderBy = { data_criacao: "desc" };
        break;
      case "oldest":
        prismaOrderBy = { data_criacao: "asc" };
        break;
      default:
        prismaOrderBy = { nome: "asc" };
    }

    const isComplexOrder = [
      "price_asc",
      "price_desc",
      "stock_asc",
      "stock_desc",
    ].includes(orderBy || "");

    const includeQuery = {
      produto_variacao: {
        select: {
          quantidade: true,
          valor: true,
          imagem_variacao: {
            take: 1,
            orderBy: { principal: "desc" } as const,
            select: { caminho: true, principal: true },
          },
        },
      },
    };

    if (isComplexOrder) {
      const allProducts = await prisma.produto.findMany({
        where,
        include: includeQuery,
      });

      const processed = this.processProductListing(
        allProducts as ProductWithCoverRaw[],
      );

      processed.sort((a, b) => {
        if (orderBy === "price_asc") return a.menor_valor - b.menor_valor;
        if (orderBy === "price_desc") return b.menor_valor - a.menor_valor;
        if (orderBy === "stock_asc") return a.total_estoque - b.total_estoque;
        if (orderBy === "stock_desc") return b.total_estoque - a.total_estoque;
        return 0;
      });

      const total = processed.length;
      const paginatedData = processed.slice(skip, skip + limit);

      return { data: paginatedData, total };
    } else {
      const [dataRaw, total] = await Promise.all([
        prisma.produto.findMany({
          where,
          take: limit,
          skip,
          orderBy: prismaOrderBy,
          include: includeQuery,
        }),
        prisma.produto.count({ where }),
      ]);

      return {
        data: this.processProductListing(dataRaw as ProductWithCoverRaw[]),
        total,
      };
    }
  }

  async searchPaginated(
    query: string,
    page: number,
    limit: number,
    lojaId?: string,
    orderBy?: string,
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

    let prismaOrderBy: Prisma.produtoOrderByWithRelationInput | undefined;
    switch (orderBy) {
      case "name_asc":
        prismaOrderBy = { nome: "asc" };
        break;
      case "name_desc":
        prismaOrderBy = { nome: "desc" };
        break;
      case "newest":
        prismaOrderBy = { data_criacao: "desc" };
        break;
      case "oldest":
        prismaOrderBy = { data_criacao: "asc" };
        break;
      default:
        prismaOrderBy = { nome: "asc" };
    }

    const isComplexOrder = [
      "price_asc",
      "price_desc",
      "stock_asc",
      "stock_desc",
    ].includes(orderBy || "");

    const includeQuery = {
      produto_variacao: {
        select: {
          quantidade: true,
          valor: true,
          imagem_variacao: {
            take: 1,
            orderBy: { principal: "desc" } as const,
            select: { caminho: true, principal: true },
          },
        },
      },
    };

    if (isComplexOrder) {
      const allProducts = await prisma.produto.findMany({
        where,
        include: includeQuery,
      });

      const processed = this.processProductListing(
        allProducts as ProductWithCoverRaw[],
      );

      processed.sort((a, b) => {
        if (orderBy === "price_asc") return a.menor_valor - b.menor_valor;
        if (orderBy === "price_desc") return b.menor_valor - a.menor_valor;
        if (orderBy === "stock_asc") return a.total_estoque - b.total_estoque;
        if (orderBy === "stock_desc") return b.total_estoque - a.total_estoque;
        return 0;
      });

      const total = processed.length;
      const paginatedData = processed.slice(skip, skip + limit);

      return { data: paginatedData, total };
    } else {
      const [dataRaw, total] = await Promise.all([
        prisma.produto.findMany({
          where,
          take: limit,
          skip,
          orderBy: prismaOrderBy,
          include: includeQuery,
        }),
        prisma.produto.count({ where }),
      ]);

      return {
        data: this.processProductListing(dataRaw as ProductWithCoverRaw[]),
        total,
      };
    }
  }

  // --- CRUD VARIAÇÕES ---
  async createVariation(data: CreateVariationDTO): Promise<VariationEntity> {
    const imagensCreate = data.files?.map((file, index) => ({
      id_imagem: randomUUID(),
      caminho: file.path,
      principal: index === 0,
      ordem: index,
    }));

    const variation = await prisma.produto_variacao.create({
      data: {
        id_produto: data.id_produto,
        nome: data.nome,
        descricao: data.descricao,
        quantidade: data.quantidade,
        valor: data.valor,
        imagem_variacao:
          imagensCreate && imagensCreate.length > 0
            ? { create: imagensCreate }
            : undefined,
      },
      include: { imagem_variacao: true },
    });
    return this.mapToVariationEntity(variation);
  }

  // >>> MUDANÇA IMPORTANTE AQUI:
  async updateVariation(
    id: string,
    data: UpdateVariationDTO,
  ): Promise<VariationEntity> {
    // 1. Prepara novas imagens (se houver upload)
    const imagensCreate = data.files?.map((file, index) => ({
      id_imagem: randomUUID(),
      caminho: file.path,
      principal: false, // Por padrão false, ou ajuste sua lógica de "Principal"
      ordem: index,
    }));

    // 2. Busca imagens atuais no banco para comparar
    const currentVariation = await prisma.produto_variacao.findUnique({
      where: { id_variacao: id },
      include: { imagem_variacao: true },
    });

    const currentImages = currentVariation?.imagem_variacao || [];

    // 3. Normaliza o input kept_images (pode vir string única, array ou undefined)
    let keptIds: string[] = [];
    if (Array.isArray(data.kept_images)) {
      keptIds = data.kept_images;
    } else if (typeof data.kept_images === "string") {
      keptIds = [data.kept_images];
    }
    // Se undefined, keptIds fica vazio [], o que significaria apagar todas as antigas.

    // 4. Identifica quais imagens devem ser EXCLUÍDAS (estão no banco, mas não no keptIds)
    const imagesToDelete = currentImages.filter(
      (img) => !keptIds.includes(img.id_imagem),
    );

    // 5. Apaga arquivos físicos do disco
    for (const img of imagesToDelete) {
      this.deleteFilesFromDisk(img.caminho);
    }

    // 6. Atualiza no Banco (Delete as removidas + Create as novas)
    const variation = await prisma.produto_variacao.update({
      where: { id_variacao: id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        quantidade: data.quantidade,
        valor: data.valor,
        ultima_atualizacao: new Date(),
        imagem_variacao: {
          // Deleta APENAS as que filtramos acima
          deleteMany: {
            id_imagem: { in: imagesToDelete.map((i) => i.id_imagem) },
          },
          // Cria as novas (se houver arquivos)
          create:
            imagensCreate && imagensCreate.length > 0
              ? imagensCreate
              : undefined,
        },
      },
      include: { imagem_variacao: true },
    });

    return this.mapToVariationEntity(variation);
  }

  async deleteVariation(id: string): Promise<void> {
    const variationToDelete = await prisma.produto_variacao.findUnique({
      where: { id_variacao: id },
      include: { imagem_variacao: true },
    });

    if (variationToDelete && variationToDelete.imagem_variacao) {
      for (const img of variationToDelete.imagem_variacao) {
        this.deleteFilesFromDisk(img.caminho);
      }
    }
    await prisma.produto_variacao.delete({ where: { id_variacao: id } });
  }

  async findVariationById(id: string): Promise<VariationEntity | null> {
    const variation = await prisma.produto_variacao.findUnique({
      where: { id_variacao: id },
      include: { imagem_variacao: true },
    });
    return variation ? this.mapToVariationEntity(variation) : null;
  }

  // --- MÉTODOS AUXILIARES ---
  async findVariationsPaginated(
    page: number,
    limit: number,
    lojaId?: string,
  ): Promise<{ data: VariationEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.produto_variacaoWhereInput = lojaId
      ? { produto: { id_loja: lojaId } }
      : {};

    const [data, total] = await Promise.all([
      prisma.produto_variacao.findMany({
        where,
        take: limit,
        skip,
        orderBy: { nome: "asc" },
        include: { imagem_variacao: true },
      }),
      prisma.produto_variacao.count({ where }),
    ]);
    return { data: data.map((v) => this.mapToVariationEntity(v)), total };
  }

  async searchVariations(
    query: string,
    page: number,
    limit: number,
    lojaId?: string,
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
        include: { imagem_variacao: true },
      }),
      prisma.produto_variacao.count({ where }),
    ]);
    return { data: data.map((v) => this.mapToVariationEntity(v)), total };
  }

  async findVariationsByProduct(
    productId: string,
    page: number,
    limit: number,
  ): Promise<{ data: VariationEntity[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.produto_variacaoWhereInput = { id_produto: productId };

    const [data, total] = await Promise.all([
      prisma.produto_variacao.findMany({
        where,
        take: limit,
        skip,
        orderBy: { nome: "asc" },
        include: { imagem_variacao: true },
      }),
      prisma.produto_variacao.count({ where }),
    ]);
    return { data: data.map((v) => this.mapToVariationEntity(v)), total };
  }

  async searchVariationsByProduct(
    productId: string,
    query: string,
    page: number,
    limit: number,
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
        include: { imagem_variacao: true },
      }),
      prisma.produto_variacao.count({ where }),
    ]);
    return { data: data.map((v) => this.mapToVariationEntity(v)), total };
  }
}
