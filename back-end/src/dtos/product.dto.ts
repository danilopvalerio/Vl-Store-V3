// src/dtos/product.dto.ts
import {
  produto as ProductModel,
  produto_variacao as VariationModel,
} from "../generated/prisma/client";

// --- PRODUTO (PAI) ---

export interface CreateProductDTO {
  id_loja: string;
  referencia?: string;
  nome: string;
  categoria?: string;
  material?: string;
  genero?:
    | "MASCULINO"
    | "FEMININO"
    | "UNISSEX"
    | "INFANTIL_MASCULINO"
    | "INFANTIL_FEMININO"
    | "INFANTIL_UNISSEX"
    | null;
}

export interface UpdateProductDTO {
  referencia?: string;
  nome?: string;
  categoria?: string;
  material?: string;
  genero?:
    | "MASCULINO"
    | "FEMININO"
    | "UNISSEX"
    | "INFANTIL_MASCULINO"
    | "INFANTIL_FEMININO"
    | "INFANTIL_UNISSEX"
    | null;
  ativo?: boolean;
}

// Tipo de retorno combinado
export type ProductResponseDTO = ProductModel & {
  produto_variacao?: VariationModel[];
};

// --- VARIAÇÃO (FILHO) ---

export interface CreateVariationDTO {
  id_produto: string;
  nome: string; // Ex: "Tamanho G"
  descricao?: string;
  quantidade: number;
  valor: number;
}

export interface UpdateVariationDTO {
  nome?: string;
  descricao?: string;
  quantidade?: number;
  valor?: number;
}

export type VariationResponseDTO = VariationModel & {
  produto?: ProductModel;
};
