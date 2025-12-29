import { IBaseRepository } from "../../shared/dtos/index.dto";

// --- SAÍDA (Response) ---
export interface LojaResponseDTO {
  id_loja: string;
  admin_user_id: string | null;
  nome: string;
  cnpj_cpf: string | null;
  data_criacao: Date | null;
  ultima_atualizacao: Date | null;
}

// --- ENTRADA (Input) ---
export interface CreateLojaDTO {
  nome: string;
  cnpj_cpf?: string;
  admin_user_id?: string; // O ID do usuário que será o dono (vem do token)
  actorUserId?: string; // ID de quem está executando a ação (para logs)
}

export interface UpdateLojaDTO {
  nome?: string;
  cnpj_cpf?: string;
  admin_user_id?: string;
  actorUserId?: string;
}

// --- INTERFACE DO REPOSITÓRIO ---
export interface ILojaRepository
  extends IBaseRepository<LojaResponseDTO, CreateLojaDTO, UpdateLojaDTO> {
  // Método específico para verificar duplicidade de documento
  findByDoc(cnpj_cpf: string): Promise<LojaResponseDTO | null>;
}
