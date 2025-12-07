import { LojaRepository } from "../repositories/loja.repository";
import { loja as Loja } from "../generated/prisma/client"; // Ajuste conforme seu path do prisma
import { CreateLojaDTO, UpdateLojaDTO } from "../dtos/loja.dto";
import { LogService } from "./log.service";
import { AppError } from "../middlewares/error.middleware";

export class LojaService {
  private repo = new LojaRepository();
  private logService = new LogService();

  // ============================================================================
  // CREATE LOJA
  // ============================================================================
  async createLoja(data: CreateLojaDTO, actorUserId?: string): Promise<Loja> {
    // 1. Validação de Documento (Lógica de Rede/Filial)
    if (data.cnpj_cpf) {
      const existing = await this.repo.findByDoc(data.cnpj_cpf);

      // Se já existe uma loja com esse documento...
      if (existing) {
        // ...verificamos se o dono é diferente.
        // Se for diferente, bloqueia (CNPJ pertence a outra pessoa).
        if (existing.admin_user_id !== data.admin_user_id) {
          throw new AppError(
            "Este CPF/CNPJ já está vinculado a outro proprietário.",
            409
          );
        }
        // Se for o mesmo dono, o código segue (permite criar filial com mesmo CNPJ)
      }
    }

    // 2. Criação
    const newLoja = await this.repo.create({
      nome: data.nome,
      cnpj_cpf: data.cnpj_cpf,
      admin_user_id: data.admin_user_id,
    });

    // 3. Log de Sistema
    // Se não tiver actorUserId (cadastro inicial), usa o próprio admin da loja
    const idUserLog = actorUserId || data.admin_user_id;

    if (idUserLog) {
      await this.logService.logSystem({
        id_user: idUserLog,
        acao: "Criar Loja",
        detalhes: `Nova loja '${newLoja.nome}' (ID: ${newLoja.id_loja}) registrada no sistema.`,
      });
    }

    return newLoja;
  }

  // ============================================================================
  // UPDATE LOJA
  // ============================================================================
  async updateLoja(
    id_loja: string,
    data: UpdateLojaDTO,
    actorUserId: string
  ): Promise<Loja> {
    const existing = await this.repo.findById(id_loja);
    if (!existing) throw new AppError("Loja não encontrada.", 404);

    // 1. Validação de Documento na Edição
    if (data.cnpj_cpf && data.cnpj_cpf !== existing.cnpj_cpf) {
      const docExists = await this.repo.findByDoc(data.cnpj_cpf);

      if (docExists) {
        // Não posso usar um CNPJ que pertence a outro dono
        // (Nota: docExists.id_loja !== id_loja é implícito se os donos forem diferentes)
        if (docExists.admin_user_id !== existing.admin_user_id) {
          throw new AppError(
            "O CPF/CNPJ já está em uso por outro proprietário.",
            409
          );
        }
      }
    }

    const updateData: Partial<Loja> = {};
    const mudancas: string[] = [];

    // 2. Mapeamento de Mudanças
    if (data.nome && data.nome !== existing.nome) {
      updateData.nome = data.nome;
      mudancas.push(`Nome alterado de '${existing.nome}' para '${data.nome}'`);
    }

    if (data.cnpj_cpf && data.cnpj_cpf !== existing.cnpj_cpf) {
      updateData.cnpj_cpf = data.cnpj_cpf;
      mudancas.push(`Documento (CNPJ) alterado`);
    }

    if (data.admin_user_id && data.admin_user_id !== existing.admin_user_id) {
      updateData.admin_user_id = data.admin_user_id;
      mudancas.push(`Proprietário alterado para ID: ${data.admin_user_id}`);
    }

    // 3. Execução do Update
    let updatedLoja = existing;
    if (Object.keys(updateData).length > 0) {
      updatedLoja = await this.repo.updateById(id_loja, updateData);
    }

    // 4. Log
    if (mudancas.length > 0) {
      await this.logService.logSystem({
        id_user: actorUserId,
        acao: "Atualizar Loja",
        detalhes: `Loja ${
          existing.nome
        } (ID: ${id_loja}) atualizada. Mudanças: ${mudancas.join(". ")}.`,
      });
    }

    return updatedLoja;
  }

  // ============================================================================
  // DELETE LOJA
  // ============================================================================
  async deleteLoja(id_loja: string, actorUserId: string): Promise<Loja> {
    const existing = await this.repo.findById(id_loja);
    if (!existing) throw new AppError("Loja não encontrada.", 404);

    const deletedLoja = await this.repo.deleteById(id_loja);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "Remover Loja",
      detalhes: `A loja '${existing.nome}' (ID: ${id_loja}) foi excluída permanentemente.`,
    });

    return deletedLoja;
  }

  // ============================================================================
  // LEITURAS (GETTERS)
  // ============================================================================
  async getLojaById(id_loja: string): Promise<Loja | null> {
    return this.repo.findById(id_loja);
  }

  async getAllLojas(): Promise<Loja[]> {
    return this.repo.findAll();
  }
}
