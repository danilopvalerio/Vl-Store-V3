//src/dtos/caixa.dto.ts
import { caixa } from "../generated/prisma/client";

export interface CreateCaixaDTO {
  id_loja: string;
  saldo_inicial: number;
  // Opcional: ID do Perfil de quem vai assumir o caixa (se for gerente abrindo pra outro)
  id_user_profile?: string;
}

// Agora atualizamos com base no ID do Perfil, não mais ID do User
export interface UpdateCaixaUserDTO {
  id_user_profile: string;
}

export interface ToggleCaixaStatusDTO {
  saldo_final?: number;
}

// O response agora pega dados direto do perfil
export interface CaixaResponseDTO extends caixa {
  nome_responsavel: string | null;
  // Email ainda pode vir através do join reverso se necessário, mas o nome é direto
}
