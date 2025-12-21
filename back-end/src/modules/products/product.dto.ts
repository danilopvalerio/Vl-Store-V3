import { IBaseRepository } from "../../shared/dtos/index.dto";

// ============================================================================
// ENTIDADES DE DOMÍNIO
// ============================================================================

export interface ProductEntity {
  id_produto: string;
  id_loja: string;
  referencia: string | null;
  nome: string;
  categoria: string | null;
  material: string | null;
  genero: string | null;
  ativo: boolean | null;
  data_criacao: Date | null;
  ultima_atualizacao: Date | null;
}

export interface VariationEntity {
  id_variacao: string;
  id_produto: string;
  nome: string | null;
  descricao: string | null;
  quantidade: number | null;
  valor: number;
  data_criacao: Date | null;
  ultima_atualizacao: Date | null;
}

// DTO estendido para listagem (inclui campos calculados)
export interface ProductListingDTO extends ProductEntity {
  total_estoque: number;
  qtd_variacoes: number;
  menor_valor: number;
}

// ============================================================================
// DTOs DE ENTRADA (PRODUTO)
// ============================================================================

export interface CreateProductDTO {
  id_loja: string;
  nome: string;
  referencia?: string;
  categoria?: string;
  material?: string;
  genero?: string;
  actorUserId?: string;
}

export interface UpdateProductDTO {
  nome?: string;
  referencia?: string;
  categoria?: string;
  material?: string;
  genero?: string;
  ativo?: boolean;
  actorUserId?: string;
}

// ============================================================================
// DTOs DE ENTRADA (VARIAÇÃO)
// ============================================================================

export interface CreateVariationDTO {
  id_produto: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  valor: number;
  actorUserId?: string;
}

export interface UpdateVariationDTO {
  nome?: string;
  descricao?: string;
  quantidade?: number;
  valor?: number;
  actorUserId?: string;
}

// ============================================================================
// INTERFACE DO REPOSITÓRIO
// ============================================================================

// CORREÇÃO: Estendendo o IBaseRepository para padronizar
export interface IProductRepository
  extends IBaseRepository<ProductEntity, CreateProductDTO, UpdateProductDTO> {
  // Sobrescrevendo a tipagem dos métodos de listagem para retornar o DTO enriquecido (ListingDTO)
  // O TypeScript permite isso se o tipo for compatível ou mais específico
  findPaginated(
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: ProductListingDTO[]; total: number }>;
  searchPaginated(
    query: string,
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: ProductListingDTO[]; total: number }>;

  // --- MÉTODOS ESPECÍFICOS DE VARIAÇÕES ---
  // (Como não criamos um módulo separado para variações BaseRepository só
  // lida com uma entidade por vez, mantemos os métodos de variações explícitos)

  createVariation(data: CreateVariationDTO): Promise<VariationEntity>;
  updateVariation(
    id: string,
    data: UpdateVariationDTO
  ): Promise<VariationEntity>;
  deleteVariation(id: string): Promise<void>;
  findVariationById(id: string): Promise<VariationEntity | null>;

  findVariationsPaginated(
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: VariationEntity[]; total: number }>;
  searchVariations(
    query: string,
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: VariationEntity[]; total: number }>;

  findVariationsByProduct(
    productId: string,
    page: number,
    limit: number
  ): Promise<{ data: VariationEntity[]; total: number }>;
  searchVariationsByProduct(
    productId: string,
    query: string,
    page: number,
    limit: number
  ): Promise<{ data: VariationEntity[]; total: number }>;
}
