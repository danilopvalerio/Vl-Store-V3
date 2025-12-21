//src/modules/cashier/movimentacao.dto.ts
import { movimentacao } from "../../shared/database/generated/prisma/client";

export type TipoMovimentacao = "ENTRADA" | "SAIDA" | "SANGRIA" | "SUPRIMENTO";

export interface CreateMovimentacaoDTO {
  id_caixa?: string;
  tipo: TipoMovimentacao;
  valor: number;
  descricao?: string;
}

export interface UpdateMovimentacaoDTO {
  valor?: number;
  descricao?: string;
  tipo?: TipoMovimentacao;
}

// CORREÇÃO: Usar type alias evita o erro de interface vazia
export type MovimentacaoResponseDTO = movimentacao;
