// src/services/log.service.ts
import { LogRepository } from "../repositories/log.repository";
import { CreateLogAcessoDTO, CreateLogSistemaDTO } from "../dtos/log.dto";

export class LogService {
  private repo = new LogRepository();

  // Função auxiliar para formatar data BR
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

  // ==========================================
  // LOG DE ACESSO
  // ==========================================

  async logAccess(data: CreateLogAcessoDTO) {
    return this.repo.createAccessLog(data);
  }

  async getAccessLogs(page = 1, perPage = 10) {
    const result = await this.repo.findAccessLogsPaginated(page, perPage);

    // Mapeia e formata a data
    const logsFormatados = result.data.map((log) => {
      return {
        id_log_acesso: log.id_log_acesso,
        data: this.formatarDataBR(log.data), // <--- Conversão aqui
        ip: log.ip,
        user_agent: log.user_agent,
        sucesso: log.sucesso,
        usuario: log.user
          ? { id: log.user.user_id, email: log.user.email }
          : undefined,
      };
    });

    return { ...result, data: logsFormatados };
  }

  async searchAccessLogs(term: string, page = 1, perPage = 10) {
    if (!term || term.trim() === "") {
      return this.getAccessLogs(page, perPage);
    }

    const result = await this.repo.searchAccessLogs(term, page, perPage);

    const logsFormatados = result.data.map((log) => {
      return {
        id_log_acesso: log.id_log_acesso,
        data: this.formatarDataBR(log.data), // <--- Conversão aqui
        ip: log.ip,
        user_agent: log.user_agent,
        sucesso: log.sucesso,
        usuario: log.user
          ? { id: log.user.user_id, email: log.user.email }
          : undefined,
      };
    });

    return { ...result, data: logsFormatados };
  }

  // ==========================================
  // LOG DE SISTEMA
  // ==========================================

  async logSystem(data: CreateLogSistemaDTO) {
    return this.repo.createSystemLog(data);
  }

  async getSystemLogs(page = 1, perPage = 10) {
    const result = await this.repo.findSystemLogsPaginated(page, perPage);

    const logsFormatados = result.data.map((log) => {
      return {
        id_log_sistema: log.id_log_sistema,
        data: this.formatarDataBR(log.data), // <--- Conversão aqui
        acao: log.acao,
        detalhes: log.detalhes,
        usuario: log.user
          ? { id: log.user.user_id, email: log.user.email }
          : undefined,
      };
    });

    return { ...result, data: logsFormatados };
  }

  async searchSystemLogs(term: string, page = 1, perPage = 10) {
    if (!term || term.trim() === "") {
      return this.getSystemLogs(page, perPage);
    }

    const result = await this.repo.searchSystemLogs(term, page, perPage);

    const logsFormatados = result.data.map((log) => {
      return {
        id_log_sistema: log.id_log_sistema,
        data: this.formatarDataBR(log.data), // <--- Conversão aqui
        acao: log.acao,
        detalhes: log.detalhes,
        usuario: log.user
          ? { id: log.user.user_id, email: log.user.email }
          : undefined,
      };
    });

    return { ...result, data: logsFormatados };
  }
}
