import { IBaseRepository } from "../../shared/dtos/index.dto";
import { UserProfileStatus } from "../../shared/database/generated/prisma/client";

// ============================================================================
// ENTIDADE DE DOMÍNIO (Espelho do Schema.prisma)
// ============================================================================
export interface UserProfileEntity {
  id_user_profile: string;
  user_id: string;
  id_loja: string;
  nome: string;
  cpf_cnpj: string | null; // DateTime? no prisma = Date | null
  cargo: string | null;
  tipo_perfil: string | null;
  status: UserProfileStatus;
  data_criacao: Date | null;
  ultima_atualizacao: Date | null;
}

// ============================================================================
// DTOs DE ENTRADA
// ============================================================================
export interface CreateUserProfileDTO {
  user_id: string;
  id_loja: string;
  nome: string;
  cpf_cnpj?: string;
  cargo?: string;
  tipo_perfil?: string;

  actorUserId?: string; // Campo de controle (não vai para o banco diretamente)
}

export interface UpdateUserProfileDTO {
  nome?: string;
  cpf_cnpj?: string;
  cargo?: string;
  tipo_perfil?: string;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED";

  actorUserId?: string;
}

// ============================================================================
// INTERFACE DO REPOSITÓRIO
// ============================================================================
export interface IUserProfileRepository
  extends IBaseRepository<
    UserProfileEntity,
    CreateUserProfileDTO,
    UpdateUserProfileDTO
  > {
  // Métodos específicos
  findByCpfCnpj(
    cpf_cnpj: string,
    id_loja?: string
  ): Promise<UserProfileEntity | null>;
  findByUserId(
    user_id: string,
    id_loja?: string
  ): Promise<UserProfileEntity | null>;

  // Métodos de paginação com filtro
  findPaginatedWithFilter(
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: UserProfileEntity[]; total: number }>;
  searchPaginatedWithFilter(
    query: string,
    page: number,
    limit: number,
    lojaId?: string
  ): Promise<{ data: UserProfileEntity[]; total: number }>;
}
