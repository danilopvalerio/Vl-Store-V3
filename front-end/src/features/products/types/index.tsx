// --- Respostas da API ---

// Variação (Filho)
export interface Variation {
  id_variacao: string;
  id_produto: string;
  nome: string; // Ex: "P", "M", "Azul"
  descricao?: string;
  quantidade: number;
  valor: string | number; // Pode vir como string decimal do banco
}

// DTO para os parâmetros de busca (Query Params)
export interface GetVariationsQueryParams {
  page: number;
  perPage: number;
  term?: string; // Opcional, pois só existe na rota de busca
}

// Produto (Pai) - ATUALIZADO
export interface Product {
  id_produto: string;
  id_loja: string;
  referencia?: string;
  nome: string;
  categoria?: string;
  material?: string;
  genero?: "MASCULINO" | "FEMININO" | "UNISSEX" | "INFANTIL" | null;
  ativo: boolean;

  // Detalhes (Presente no GetById, ausente nas Listas otimizadas)
  produto_variacao?: Variation[];

  // Campos Calculados (Presentes nas Listas, calculados pelo backend)
  total_estoque?: number; // Soma das quantidades
  qtd_variacoes?: number; // Contagem de variações
  menor_valor?: number; // Menor preço encontrado
}

// Erro da API
export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

// --- Payloads de Envio ---

export interface CreateProductPayload {
  id_loja: string;
  nome: string;
  referencia?: string;
  categoria?: string;
  material?: string;
  genero?: string;
}

export interface UpdateProductPayload {
  nome?: string;
  referencia?: string;
  categoria?: string;
  material?: string;
  genero?: string;
  ativo?: boolean;
}

export interface CreateVariationPayload {
  id_produto: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  valor: number;
}

export interface UpdateVariationPayload {
  nome?: string;
  descricao?: string;
  quantidade?: number;
  valor?: number;
}
