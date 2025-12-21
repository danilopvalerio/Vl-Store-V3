import { AccessLogRepository, SystemLogRepository } from "./log.repository";
import {
  CreateLogAcessoDTO,
  CreateLogSistemaDTO,
  LogAccessResponseDTO,
  LogSystemResponseDTO,
  LogAccessEntity,
  LogSystemEntity,
} from "./log.dto";

export class LogService {
  constructor(
    private accessRepo: AccessLogRepository,
    private systemRepo: SystemLogRepository
  ) {}

  private formatarDataBR(data: Date | null): string | null {
    if (!data) return null;
    return new Date(data).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // --- MAPPERS DE RESPOSTA ---
  private mapAccessResponse(log: LogAccessEntity): LogAccessResponseDTO {
    return {
      id_log_acesso: log.id_log_acesso,
      data: this.formatarDataBR(log.data),
      ip: log.ip,
      user_agent: log.user_agent,
      sucesso: log.sucesso,
      usuario: log.user
        ? { id: log.user.user_id, email: log.user.email }
        : undefined,
    };
  }

  private mapSystemResponse(log: LogSystemEntity): LogSystemResponseDTO {
    return {
      id_log_sistema: log.id_log_sistema,
      data: this.formatarDataBR(log.data),
      acao: log.acao,
      detalhes: log.detalhes,
      usuario: log.user
        ? { id: log.user.user_id, email: log.user.email }
        : undefined,
    };
  }

  // --- MÉTODOS DE BUSCA ---
  async logAccess(data: CreateLogAcessoDTO) {
    return this.accessRepo.create(data);
  }

  async getAccessLogs(idLoja: string, page = 1, perPage = 10) {
    const { data, total } = await this.accessRepo.findPaginated(
      idLoja,
      page,
      perPage
    );
    return {
      data: data.map((log) => this.mapAccessResponse(log)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async searchAccessLogs(idLoja: string, term: string, page = 1, perPage = 10) {
    if (!term || term.trim() === "") {
      return this.getAccessLogs(idLoja, page, perPage);
    }
    const { data, total } = await this.accessRepo.searchPaginated(
      idLoja,
      term,
      page,
      perPage
    );
    return {
      data: data.map((log) => this.mapAccessResponse(log)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async logSystem(data: CreateLogSistemaDTO) {
    return this.systemRepo.create(data);
  }

  async getSystemLogs(idLoja: string, page = 1, perPage = 10) {
    const { data, total } = await this.systemRepo.findPaginated(
      idLoja,
      page,
      perPage
    );
    return {
      data: data.map((log) => this.mapSystemResponse(log)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async searchSystemLogs(idLoja: string, term: string, page = 1, perPage = 10) {
    if (!term || term.trim() === "") {
      return this.getSystemLogs(idLoja, page, perPage);
    }
    const { data, total } = await this.systemRepo.searchPaginated(
      idLoja,
      term,
      page,
      perPage
    );
    return {
      data: data.map((log) => this.mapSystemResponse(log)),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
