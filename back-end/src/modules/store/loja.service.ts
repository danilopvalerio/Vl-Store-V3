import {
  ILojaRepository,
  CreateLojaDTO,
  UpdateLojaDTO,
  LojaEntity,
} from "./loja.dto";
import { AppError } from "../../app/middleware/error.middleware";
import { LogService } from "../logs/log.service";
// Validações manuais (isValidString, isValidUUID) removidas -> Zod

export class LojaService {
  constructor(private repo: ILojaRepository, private logService: LogService) {}

  async createLoja(data: CreateLojaDTO): Promise<LojaEntity> {
    // Validações de formato feitas pelo Zod

    // Regra de Negócio: Validação de Documento (Lógica de Rede/Filial)
    if (data.cnpj_cpf) {
      const existing = await this.repo.findByDoc(data.cnpj_cpf);
      if (existing) {
        // Se documento existe, o dono deve ser o mesmo (filial)
        if (existing.admin_user_id !== data.admin_user_id) {
          throw new AppError(
            "Este CPF/CNPJ já está vinculado a outro proprietário.",
            409
          );
        }
      }
    }

    const newLoja = await this.repo.create(data);

    // Log
    const idUserLog = data.actorUserId || data.admin_user_id;
    if (idUserLog) {
      await this.logService.logSystem({
        id_user: idUserLog,
        acao: "Criar Loja",
        detalhes: `Nova loja '${newLoja.nome}' (ID: ${newLoja.id_loja}) registrada no sistema.`,
      });
    }

    return newLoja;
  }

  async updateLoja(id: string, data: UpdateLojaDTO): Promise<LojaEntity> {
    // Validação ID UUID feita no middleware

    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Loja não encontrada.", 404);

    // Validação de Documento na Edição
    if (data.cnpj_cpf && data.cnpj_cpf !== existing.cnpj_cpf) {
      const docExists = await this.repo.findByDoc(data.cnpj_cpf);
      if (docExists) {
        if (docExists.admin_user_id !== existing.admin_user_id) {
          throw new AppError(
            "O CPF/CNPJ já está em uso por outro proprietário.",
            409
          );
        }
      }
    }

    const updatedLoja = await this.repo.update(id, data);

    await this.logService.logSystem({
      id_user: data.actorUserId,
      acao: "Atualizar Loja",
      detalhes: `Loja ${existing.nome} (ID: ${id}) atualizada.`,
    });

    return updatedLoja;
  }

  async deleteLoja(id: string, actorUserId: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Loja não encontrada.", 404);

    await this.repo.delete(id);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Loja",
      detalhes: `A loja '${existing.nome}' (ID: ${id}) foi excluída permanentemente.`,
    });
  }

  async getLojaById(id: string): Promise<LojaEntity> {
    const loja = await this.repo.findById(id);
    if (!loja) throw new AppError("Loja não encontrada", 404);
    return loja;
  }

  async getAllLojas(): Promise<LojaEntity[]> {
    return this.repo.findAll();
  }
}
