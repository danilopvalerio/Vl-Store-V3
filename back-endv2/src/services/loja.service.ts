//src/services/loja.service.ts
import { LojaRepository } from "../repositories/loja.repository";
import { loja as Loja } from "../generated/prisma/client";
import { CreateLojaDTO, UpdateLojaDTO } from "../dtos/loja.dto";

export class LojaService {
  private repo = new LojaRepository();

  // --- CREATE ---
  async createLoja(data: CreateLojaDTO): Promise<Loja> {
    // 1. Regra: CNPJ/CPF deve ser único no sistema
    if (data.cnpj_cpf) {
      const existing = await this.repo.findByDoc(data.cnpj_cpf);
      if (existing) {
        throw new Error("O CPF/CNPJ já está cadastrado");
      }
    }

    // 2. Cria a loja
    return this.repo.create({
      nome: data.nome,
      cnpj_cpf: data.cnpj_cpf,
      admin_user_id: data.admin_user_id,
    });
  }

  // --- UPDATE ---
  async updateLoja(id_loja: string, data: UpdateLojaDTO): Promise<Loja> {
    // 1. Verifica se a loja existe
    const existing = await this.repo.findById(id_loja);
    if (!existing) throw new Error("Loja não encontrada");

    // 2. Se estiver tentando mudar o CNPJ, verifica se o novo já não existe
    if (data.cnpj_cpf && data.cnpj_cpf !== existing.cnpj_cpf) {
      const docExists = await this.repo.findByDoc(data.cnpj_cpf);
      if (docExists) throw new Error("O CPF/CNPJ já está cadastrado");
    }

    // 3. Monta o objeto parcial para o banco
    const updateData: Partial<Loja> = {};

    if (data.nome) updateData.nome = data.nome;
    if (data.cnpj_cpf) updateData.cnpj_cpf = data.cnpj_cpf;
    if (data.admin_user_id) updateData.admin_user_id = data.admin_user_id;

    return this.repo.updateById(id_loja, updateData);
  }

  // --- DELETE ---
  async deleteLoja(id_loja: string): Promise<Loja> {
    const existing = await this.repo.findById(id_loja);
    if (!existing) throw new Error("Loja não encontrada");

    return this.repo.deleteById(id_loja);
  }

  // --- GETTERS ---
  async getLojaById(id_loja: string): Promise<Loja | null> {
    return this.repo.findById(id_loja);
  }

  async getAllLojas(): Promise<Loja[]> {
    return this.repo.findAll();
  }
}
