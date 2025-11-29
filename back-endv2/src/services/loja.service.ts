import { LojaRepository } from "../repositories/loja.repository";
import { loja as Loja } from "../generated/prisma/client";
import { CreateLojaDTO, UpdateLojaDTO } from "../dtos/loja.dto";
import { LogService } from "./log.service";

export class LojaService {
  private repo = new LojaRepository();
  private logService = new LogService();

  // ============================================================================
  // CREATE LOJA
  // ============================================================================
  async createLoja(data: CreateLojaDTO, actorUserId?: string): Promise<Loja> {
    if (data.cnpj_cpf) {
      const existing = await this.repo.findByDoc(data.cnpj_cpf);
      if (existing) {
        throw new Error("O CPF/CNPJ já está cadastrado");
      }
    }

    const newLoja = await this.repo.create({
      nome: data.nome,
      cnpj_cpf: data.cnpj_cpf,
      admin_user_id: data.admin_user_id,
    });

    // Log de Sistema
    await this.logService.logSystem({
      id_user: actorUserId || data.admin_user_id,
      acao: "Criar Loja",
      detalhes: `Nova loja '${newLoja.nome}' (ID: ${newLoja.id_loja}) registrada no sistema.`,
    });

    return newLoja;
  }

  // ============================================================================
  // UPDATE LOJA (Com Detalhamento)
  // ============================================================================
  async updateLoja(
    id_loja: string,
    data: UpdateLojaDTO,
    actorUserId: string
  ): Promise<Loja> {
    const existing = await this.repo.findById(id_loja);
    if (!existing) throw new Error("Loja não encontrada");

    if (data.cnpj_cpf && data.cnpj_cpf !== existing.cnpj_cpf) {
      const docExists = await this.repo.findByDoc(data.cnpj_cpf);
      if (docExists) throw new Error("O CPF/CNPJ já está cadastrado");
    }

    const updateData: Partial<Loja> = {};
    const mudancas: string[] = []; // Array de alterações

    // 1. Verifica Nome
    if (data.nome && data.nome !== existing.nome) {
      updateData.nome = data.nome;
      mudancas.push(`Nome alterado de '${existing.nome}' para '${data.nome}'`);
    }

    // 2. Verifica CNPJ
    if (data.cnpj_cpf && data.cnpj_cpf !== existing.cnpj_cpf) {
      updateData.cnpj_cpf = data.cnpj_cpf;
      mudancas.push(`Documento (CNPJ) alterado`);
    }

    // 3. Verifica Dono (Admin)
    if (data.admin_user_id && data.admin_user_id !== existing.admin_user_id) {
      updateData.admin_user_id = data.admin_user_id;
      mudancas.push(
        `Administrador (Dono) alterado para ID: ${data.admin_user_id}`
      );
    }

    // Executa update
    const updatedLoja = await this.repo.updateById(id_loja, updateData);

    // Log de Sistema
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
    if (!existing) throw new Error("Loja não encontrada");

    const deletedLoja = await this.repo.deleteById(id_loja);

    // Log de Sistema
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
