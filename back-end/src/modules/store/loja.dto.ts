import { IBaseRepository } from "../../shared/dtos/index.dto";

// ============================================================================
// ENTIDADE DE DOMÍNIO (Espelho do Schema Prisma)
// ============================================================================
export interface LojaEntity {
  id_loja: string;
  admin_user_id: string | null;
  nome: string;
  cnpj_cpf: string | null;
  data_criacao: Date | null;
  ultima_atualizacao: Date | null;
}

// ============================================================================
// DTOs DE ENTRADA
// ============================================================================
export interface CreateLojaDTO {
  nome: string;
  cnpj_cpf?: string;
  admin_user_id?: string;

  actorUserId?: string; // Para Log
}

export interface UpdateLojaDTO {
  nome?: string;
  cnpj_cpf?: string;
  admin_user_id?: string;

  actorUserId?: string; // Para Log
}

// ============================================================================
// INTERFACE DO REPOSITÓRIO
// ============================================================================
export interface ILojaRepository
  extends IBaseRepository<LojaEntity, CreateLojaDTO, UpdateLojaDTO> {
  findByDoc(cnpj_cpf: string): Promise<LojaEntity | null>;

  // Como loja geralmente não tem paginação massiva por tenant (são poucas lojas),
  // manteremos apenas o findAll e findById padrão, mas deixarei o contrato base.
}
