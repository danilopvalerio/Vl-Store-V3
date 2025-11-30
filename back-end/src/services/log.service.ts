import { LogRepository } from "../repositories/log.repository";
import { CreateLogAcessoDTO, CreateLogSistemaDTO } from "../dtos/log.dto";

export class LogService {
  private repo = new LogRepository();

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

  // --- ACESSO ---
  async logAccess(data: CreateLogAcessoDTO) {
    return this.repo.createAccessLog(data);
  }

  async getAccessLogs(idLoja: string, page = 1, perPage = 10) {
    const result = await this.repo.findAccessLogsPaginated(
      idLoja,
      page,
      perPage
    );

    // ... lógica de formatação mantém igual ...
    const logsFormatados = result.data.map((log) => ({
      id_log_acesso: log.id_log_acesso,
      data: this.formatarDataBR(log.data),
      ip: log.ip,
      user_agent: log.user_agent,
      sucesso: log.sucesso,
      usuario: log.user
        ? { id: log.user.user_id, email: log.user.email }
        : undefined,
    }));

    return { ...result, data: logsFormatados };
  }

  async searchAccessLogs(idLoja: string, term: string, page = 1, perPage = 10) {
    if (!term || term.trim() === "") {
      return this.getAccessLogs(idLoja, page, perPage);
    }
    const result = await this.repo.searchAccessLogs(
      idLoja,
      term,
      page,
      perPage
    );

    // ... formatação ...
    const logsFormatados = result.data.map((log) => ({
      id_log_acesso: log.id_log_acesso,
      data: this.formatarDataBR(log.data),
      ip: log.ip,
      user_agent: log.user_agent,
      sucesso: log.sucesso,
      usuario: log.user
        ? { id: log.user.user_id, email: log.user.email }
        : undefined,
    }));
    return { ...result, data: logsFormatados };
  }

  // --- SISTEMA ---
  async logSystem(data: CreateLogSistemaDTO) {
    return this.repo.createSystemLog(data);
  }

  async getSystemLogs(idLoja: string, page = 1, perPage = 10) {
    const result = await this.repo.findSystemLogsPaginated(
      idLoja,
      page,
      perPage
    );

    // ... formatação ...
    const logsFormatados = result.data.map((log) => ({
      id_log_sistema: log.id_log_sistema,
      data: this.formatarDataBR(log.data),
      acao: log.acao,
      detalhes: log.detalhes,
      usuario: log.user
        ? { id: log.user.user_id, email: log.user.email }
        : undefined,
    }));
    return { ...result, data: logsFormatados };
  }

  async searchSystemLogs(idLoja: string, term: string, page = 1, perPage = 10) {
    if (!term || term.trim() === "") {
      return this.getSystemLogs(idLoja, page, perPage);
    }
    const result = await this.repo.searchSystemLogs(
      idLoja,
      term,
      page,
      perPage
    );

    // ... formatação ...
    const logsFormatados = result.data.map((log) => ({
      id_log_sistema: log.id_log_sistema,
      data: this.formatarDataBR(log.data),
      acao: log.acao,
      detalhes: log.detalhes,
      usuario: log.user
        ? { id: log.user.user_id, email: log.user.email }
        : undefined,
    }));
    return { ...result, data: logsFormatados };
  }
}
