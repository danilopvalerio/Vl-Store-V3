// src/shared/dtos/index.dto.ts

// --- Entradas (Inputs) ---

export interface PaginatedQueryDTO {
  page: number;
  limit: number;
}

export interface SearchPaginatedQueryDTO extends PaginatedQueryDTO {
  query: string;
}

// --- Saídas (Outputs) ---

// Retorno cru do Repositório (Dados + Total)
export interface RepositoryPaginatedResult<T> {
  data: T[];
  total: number;
}

// Retorno enriquecido do Service para o Controller (Com metadados de página)
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

/**
 * Interface Genérica Base para Repositórios (Generic Repository Pattern)
 * T = Entidade do Banco (Ex: UserEntity)
 * C = DTO de Criação (Ex: CreateUserDTO)
 * U = DTO de Atualização (Ex: UpdateUserDTO)
 */
export interface IBaseRepository<T, C, U> {
  create(data: C): Promise<T>;
  update(id: string, data: U): Promise<T>;
  findById(id: string): Promise<T | null>;
  delete(id: string): Promise<void>;

  // Métodos de listagem padrão para todas as entidades
  findPaginated(
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<T>>;
  searchPaginated(
    query: string,
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<T>>;
  findAll(): Promise<T[]>;
}

/**
 * Interface Base Específica para Repositórios de LOGS.
 * Diferenças do IBaseRepository:
 * 1. Não possui update() nem delete() (Logs são imutáveis).
 * 2. findPaginated e searchPaginated exigem 'idLoja' (Contexto de segurança).
 * * T = Entidade do Log (Ex: LogAccessEntity)
 * C = DTO de Criação (Ex: CreateLogAcessoDTO)
 */
export interface ILogBaseRepository<T, C> {
  create(data: C): Promise<void>; // Logs geralmente são fire-and-forget, não precisam retornar o objeto

  findPaginated(
    idLoja: string,
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<T>>;

  searchPaginated(
    idLoja: string,
    query: string,
    page: number,
    limit: number
  ): Promise<RepositoryPaginatedResult<T>>;
}
