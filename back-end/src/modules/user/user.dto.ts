import { IBaseRepository } from "../../shared/dtos/index.dto";

// ============================================================================
// 1. ENTIDADE DE DOMÍNIO (Uso Interno - Com Senha)
// ============================================================================
export interface UserEntity {
  user_id: string;
  email: string;
  senha_hash: string;
  ativo: boolean;
  data_criacao: Date | null;
  ultima_atualizacao: Date | null;
  // Telefones mapeados (opcional no domínio interno se não houver include)
  telefones?: string[];
}

// ============================================================================
// 2. DTO DE RESPOSTA (Uso Externo - Sem Senha)
// ============================================================================
export interface UserResponseDTO {
  id: string;
  email: string;
  ativo: boolean;
  criadoEm: Date | null;
  // Telefones reinseridos para o front
  telefones: string[];
}

// ============================================================================
// 3. DTOs DE ENTRADA (Inputs)
// ============================================================================
export interface CreateUserDTO {
  email: string;
  senha?: string;
  telefones?: string[]; // Array de strings (ex: ["11999999999", "11888888888"])

  // Perfil inicial
  nome: string;
  id_loja: string;
  cpf_cnpj?: string;
  cargo?: string;
  tipo_perfil: string;
}

export interface UpdateUserDTO {
  email?: string;
  senha?: string;
  ativo?: boolean;
  telefones?: string[]; // Opcional: Se enviado, substitui os antigos
}

// ============================================================================
// 4. CONTRATO DO REPOSITÓRIO
// ============================================================================
export interface IUserRepository
  extends IBaseRepository<UserEntity, CreateUserDTO, UpdateUserDTO> {
  findByEmail(email: string): Promise<UserEntity | null>;

  findPaginatedSafe(
    page: number,
    limit: number
  ): Promise<{ data: UserResponseDTO[]; total: number }>;
  searchPaginatedSafe(
    query: string,
    page: number,
    limit: number
  ): Promise<{ data: UserResponseDTO[]; total: number }>;
}
