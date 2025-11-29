import { prisma } from "../database/prisma";
import {
  Prisma,
  produto as Product,
  produto_variacao as Variation,
} from "../generated/prisma/client";

export class ProductRepository {
  // ==========================================
  // PRODUTO - CRUD BÁSICO
  // ==========================================

  async createProduct(
    data: Prisma.produtoUncheckedCreateInput
  ): Promise<Product> {
    return prisma.produto.create({ data });
  }

  async findProductById(id_produto: string) {
    return prisma.produto.findUnique({
      where: { id_produto },
      include: { produto_variacao: true },
    });
  }

  async updateProduct(
    id_produto: string,
    data: Prisma.produtoUpdateInput
  ): Promise<Product> {
    return prisma.produto.update({
      where: { id_produto },
      data,
    });
  }

  async deleteProduct(id_produto: string): Promise<Product> {
    return prisma.produto.delete({ where: { id_produto } });
  }

  // ==========================================
  // HELPER PRIVADO (Para evitar repetição de código)
  // ==========================================

  // Função auxiliar para processar os dados brutos e calcular os totais
  private processProductData(productsRaw: any[]) {
    return productsRaw.map((product) => {
      const variacoes = product.produto_variacao || [];

      // 1. Soma do Estoque
      const totalEstoque = variacoes.reduce(
        (acc: number, item: any) => acc + (item.quantidade ?? 0),
        0
      );

      // 2. Quantidade de Variações
      const qtdVariacoes = variacoes.length;

      // 3. Menor Valor (Preço "A partir de")
      // Mapeia os valores para números. Se não houver variações, o menor valor é 0.
      let menorValor = 0;
      if (variacoes.length > 0) {
        const precos = variacoes.map((v: any) => Number(v.valor));
        menorValor = Math.min(...precos);
      }

      // Remove o array pesado de variações do objeto final
      const { produto_variacao, ...productData } = product;

      return {
        ...productData,
        total_estoque: totalEstoque,
        qtd_variacoes: qtdVariacoes,
        menor_valor: menorValor,
      };
    });
  }

  // ==========================================
  // PRODUTO - LISTAGENS COM CÁLCULOS
  // ==========================================

  async findProductsPaginated(page: number, perPage: number, lojaId?: string) {
    const offset = (page - 1) * perPage;

    const where: Prisma.produtoWhereInput = {};
    if (lojaId) where.id_loja = lojaId;

    const total = await prisma.produto.count({ where });

    const productsRaw = await prisma.produto.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { nome: "asc" },
      include: {
        // Trazemos apenas o necessário para os cálculos
        produto_variacao: {
          select: {
            quantidade: true,
            valor: true,
          },
        },
      },
    });

    const data = this.processProductData(productsRaw);

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async searchProducts(
    term: string,
    page: number,
    perPage: number,
    lojaId?: string
  ) {
    const offset = (page - 1) * perPage;

    const searchCondition: Prisma.produtoWhereInput = {
      OR: [
        { nome: { contains: term, mode: "insensitive" } },
        { referencia: { contains: term, mode: "insensitive" } },
        { categoria: { contains: term, mode: "insensitive" } },
      ],
    };

    const where: Prisma.produtoWhereInput = lojaId
      ? { AND: [{ id_loja: lojaId }, searchCondition] }
      : searchCondition;

    const total = await prisma.produto.count({ where });

    const productsRaw = await prisma.produto.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { nome: "asc" },
      include: {
        produto_variacao: {
          select: {
            quantidade: true,
            valor: true,
          },
        },
      },
    });

    const data = this.processProductData(productsRaw);

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  // ==========================================
  // VARIAÇÃO - CRUD
  // ==========================================

  async createVariation(data: Prisma.produto_variacaoUncheckedCreateInput) {
    return prisma.produto_variacao.create({
      data,
      include: { produto: true },
    });
  }

  async findVariationById(id_variacao: string) {
    return prisma.produto_variacao.findUnique({
      where: { id_variacao },
      include: { produto: true },
    });
  }

  async updateVariation(
    id_variacao: string,
    data: Prisma.produto_variacaoUpdateInput
  ) {
    return prisma.produto_variacao.update({
      where: { id_variacao },
      data,
      include: { produto: true },
    });
  }

  async deleteVariation(id_variacao: string) {
    return prisma.produto_variacao.delete({
      where: { id_variacao },
      include: { produto: true },
    });
  }

  async findVariationsPaginated(
    page: number,
    perPage: number,
    lojaId?: string
  ) {
    const offset = (page - 1) * perPage;
    const where: Prisma.produto_variacaoWhereInput = {};
    if (lojaId) where.produto = { id_loja: lojaId };
    const total = await prisma.produto_variacao.count({ where });
    const data = await prisma.produto_variacao.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { nome: "asc" },
      include: { produto: true },
    });
    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async searchVariations(
    term: string,
    page: number,
    perPage: number,
    lojaId?: string
  ) {
    const offset = (page - 1) * perPage;
    const searchCondition: Prisma.produto_variacaoWhereInput = {
      OR: [
        { nome: { contains: term, mode: "insensitive" } },
        { produto: { nome: { contains: term, mode: "insensitive" } } },
        { produto: { referencia: { contains: term, mode: "insensitive" } } },
      ],
    };
    const where: Prisma.produto_variacaoWhereInput = lojaId
      ? { AND: [{ produto: { id_loja: lojaId } }, searchCondition] }
      : searchCondition;
    const total = await prisma.produto_variacao.count({ where });
    const data = await prisma.produto_variacao.findMany({
      where,
      take: perPage,
      skip: offset,
      include: { produto: true },
    });
    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
