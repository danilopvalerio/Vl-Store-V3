// src/repositories/product.repository.ts
import { prisma } from "../database/prisma";
// Importamos o namespace 'Prisma' (para tipos utilitários)
// e os modelos gerados (Product e Variation) para uso no código
import { Prisma, produto as Product } from "../generated/prisma/client";

// ============================================================================
// 1. TIPO PERSONALIZADO (A "Mágica" para remover o 'any')
// ============================================================================
/* O Prisma retorna tipos diferentes dependendo do que você pede no 'include' ou 'select'.
   O utilitário `Prisma.produtoGetPayload` cria um tipo TypeScript exato que corresponde 
   ao retorno da query específica que faremos nas listagens (trazendo variações parciais).
*/
type ProductWithVariationsRaw = Prisma.produtoGetPayload<{
  include: {
    produto_variacao: {
      select: {
        quantidade: true;
        valor: true;
      };
    };
  };
}>;

export class ProductRepository {
  // ============================================================================
  // PRODUTO - CRUD BÁSICO
  // ============================================================================

  /* Uso de `UncheckedCreateInput`:
     Diferença chave: 
     - CreateInput: Espera objetos aninhados para conexões (ex: connect: { id: ... }).
     - UncheckedCreateInput: Permite passar IDs (FKs) diretamente como strings/primitivos.
       Como seu DTO já tem 'id_loja' como string, este é o tipo correto.
  */
  async createProduct(
    data: Prisma.produtoUncheckedCreateInput
  ): Promise<Product> {
    return prisma.produto.create({ data });
  }

  async findProductById(id_produto: string) {
    return prisma.produto.findUnique({
      where: { id_produto }, // Clausula WHERE id_produto = X
      // 'include' funciona como um JOIN. Traz o objeto completo das variações.
      include: { produto_variacao: true },
    });
  }

  /* Uso de `Prisma.produtoUpdateInput`:
     Garante que o objeto 'data' contenha APENAS campos que existem na tabela 'produto'.
     Se tentarmos passar um campo inexistente, o TypeScript apontará erro aqui.
  */
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

  // ============================================================================
  // HELPER PRIVADO (PROCESSAMENTO DE DADOS)
  // ============================================================================

  // Recebe o array tipado com o 'ProductWithVariationsRaw' definido no topo.
  private processProductData(productsRaw: ProductWithVariationsRaw[]) {
    return productsRaw.map((product) => {
      // Garante que é um array, mesmo se vier null (segurança extra)
      const variacoes = product.produto_variacao || [];

      // 1. Soma do Estoque (Reduce padrão do JS)
      const totalEstoque = variacoes.reduce(
        (acc, item) => acc + (item.quantidade ?? 0),
        0
      );

      // 2. Quantidade de opções
      const qtdVariacoes = variacoes.length;

      // 3. Menor Valor ("A partir de...")
      let menorValor = 0;
      if (variacoes.length > 0) {
        // Prisma retorna Decimal. Convertemos para Number para usar Math.min
        const precos = variacoes.map((v) => Number(v.valor));
        menorValor = Math.min(...precos);
      }

      // Desestruturação para remover a lista pesada de 'produto_variacao' do objeto final
      // O front-end receberá apenas os totais calculados.
      const { produto_variacao: _produto_variacao, ...productData } = product;

      return {
        ...productData,
        total_estoque: totalEstoque,
        qtd_variacoes: qtdVariacoes,
        menor_valor: menorValor,
      };
    });
  }

  // ============================================================================
  // PRODUTO - LISTAGENS COM PAGINAÇÃO E CÁLCULOS
  // ============================================================================

  async findProductsPaginated(page: number, perPage: number, lojaId?: string) {
    // Cálculo do OFFSET (pular X registros)
    const offset = (page - 1) * perPage;

    // Objeto where tipado. Começa vazio.
    const where: Prisma.produtoWhereInput = {};

    // Adição condicional: só filtra por loja se o ID for passado
    if (lojaId) {
      where.id_loja = lojaId;
    }

    // 1. Conta o total para saber quantas páginas existem
    const total = await prisma.produto.count({ where });

    // 2. Busca os dados
    const productsRaw = await prisma.produto.findMany({
      where,
      take: perPage, // LIMIT
      skip: offset, // OFFSET
      orderBy: { nome: "asc" },

      // Otimização de Performance:
      // Em vez de trazer todas as colunas da variação ('include: { produto_variacao: true }'),
      // usamos 'select' para trazer APENAS 'quantidade' e 'valor'.
      // Isso reduz drasticamente o tráfego de dados do banco para a API.
      include: {
        produto_variacao: {
          select: {
            quantidade: true,
            valor: true,
          },
        },
      },
    });

    // Processa os totais usando o helper
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

    // Condição de busca reutilizável (OR)
    // mode: 'insensitive' faz o ILIKE (ignora maiúsculas/minúsculas)
    const searchCondition: Prisma.produtoWhereInput = {
      OR: [
        { nome: { contains: term, mode: "insensitive" } },
        { referencia: { contains: term, mode: "insensitive" } },
        { categoria: { contains: term, mode: "insensitive" } },
      ],
    };

    // Mescla filtro de loja (AND) com busca (OR), se necessário
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

  // ============================================================================
  // VARIAÇÃO - CRUD E LISTAGENS
  // ============================================================================

  async createVariation(data: Prisma.produto_variacaoUncheckedCreateInput) {
    return prisma.produto_variacao.create({
      data,
      include: { produto: true }, // Retorna o produto pai para logs/contexto
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

  // Listagem global de variações (Ex: Tabela geral de estoque)
  async findVariationsPaginated(
    page: number,
    perPage: number,
    lojaId?: string
  ) {
    const offset = (page - 1) * perPage;

    // Filtro Relacional:
    // "Busque na tabela produto_variacao onde a tabela 'produto' associada tenha id_loja = X"
    const where: Prisma.produto_variacaoWhereInput = {};
    if (lojaId) {
      where.produto = { id_loja: lojaId };
    }

    const total = await prisma.produto_variacao.count({ where });

    const data = await prisma.produto_variacao.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { nome: "asc" },
      include: { produto: true }, // Traz dados do pai (nome do produto)
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

    // Busca profunda: Procura no nome da variação OU no nome/referência do produto pai
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

  // Listagem de variações DE UM PRODUTO específico (Ex: Detalhes do Produto)
  async findVariationsPaginatedByProduct(
    productId: string,
    page: number,
    perPage: number
  ) {
    const offset = (page - 1) * perPage;

    const where: Prisma.produto_variacaoWhereInput = {
      id_produto: productId,
    };

    const total = await prisma.produto_variacao.count({ where });

    const data = await prisma.produto_variacao.findMany({
      where,
      take: perPage,
      skip: offset,
      orderBy: { nome: "asc" },
    });

    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async searchVariationsByProduct(
    productId: string,
    term: string,
    page: number,
    perPage: number
  ) {
    const offset = (page - 1) * perPage;

    const where: Prisma.produto_variacaoWhereInput = {
      AND: [
        { id_produto: productId }, // Obrigatoriamente deste produto
        {
          OR: [
            { nome: { contains: term, mode: "insensitive" } },
            // Permite buscar também pelo nome do pai (redundante mas útil para UX)
            { produto: { nome: { contains: term, mode: "insensitive" } } },
          ],
        },
      ],
    };

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
}
