import { StoreRegistration } from "./store-registration-interface";

export interface Product {
  referencia: string;
  id_loja: string;
  nome: string;
  categoria: string;
  material: string;
  genero?: string;
  loja: StoreRegistration;
  variacoes: ProductVariation[];
}

export interface ProductVariation {
  descricao_variacao: string;
  quant_variacao: number;
  valor: number;
}

export interface ProductCardProps {
  product: Product;
}
