import { prisma } from "../../shared/database/prisma"; // Import direto do prisma para Transaction
import {
  ILojaRepository,
  CreateLojaDTO,
  UpdateLojaDTO,
  LojaResponseDTO,
} from "./loja.dto";
import { AppError } from "../../app/middleware/error.middleware";
import { LogService } from "../logs/log.service";

export class LojaService {
  constructor(private repo: ILojaRepository, private logService: LogService) {}

  async createLoja(data: CreateLojaDTO): Promise<LojaResponseDTO> {
    // 1. Validação: Documento Único (Regra de Negócio)
    if (data.cnpj_cpf) {
      const existing = await this.repo.findByDoc(data.cnpj_cpf);
      // Se já existe e o dono é diferente, bloqueia.
      if (existing && existing.admin_user_id !== data.admin_user_id) {
        throw new AppError(
          "Este CNPJ/CPF já está vinculado a outro proprietário.",
          409
        );
      }
    }

    if (!data.admin_user_id) {
      throw new AppError(
        "Erro interno: ID do proprietário não identificado.",
        500
      );
    }

    // 2. Busca dados do usuário atual para replicar no novo perfil
    // (Tentamos achar qualquer perfil ativo dele para copiar o Nome e CPF pessoal)
    const currentUserInfo = await prisma.user_profile.findFirst({
      where: { user_id: data.admin_user_id },
      select: { nome: true, cpf_cnpj: true },
    });

    const nomeUser = currentUserInfo?.nome || "Administrador";
    const cpfUser = currentUserInfo?.cpf_cnpj || "";

    // 3. TRANSAÇÃO: Criar Loja + Criar Perfil Admin
    const result = await prisma.$transaction(async (tx) => {
      // A. Cria a Loja
      const novaLoja = await tx.loja.create({
        data: {
          nome: data.nome,
          cnpj_cpf: data.cnpj_cpf,
          admin_user_id: data.admin_user_id,
        },
      });

      // B. Cria o Perfil de Admin nesta nova loja para o usuário logado
      await tx.user_profile.create({
        data: {
          user_id: data.admin_user_id!,
          id_loja: novaLoja.id_loja,
          nome: nomeUser,
          cpf_cnpj: cpfUser,
          tipo_perfil: "ADMIN",
          cargo: "Proprietário",
          status: "ACTIVE",
        },
      });

      return novaLoja;
    });

    // 4. Log de Auditoria
    if (data.actorUserId) {
      await this.logService.logSystem({
        id_user: data.actorUserId,
        acao: "CRIAR_LOJA",
        detalhes: `Nova loja '${result.nome}' criada com sucesso.`,
      });
    }

    // Retorna no formato DTO
    return {
      id_loja: result.id_loja,
      nome: result.nome,
      cnpj_cpf: result.cnpj_cpf,
      admin_user_id: result.admin_user_id,
      data_criacao: result.data_criacao,
      ultima_atualizacao: result.ultima_atualizacao,
    };
  }

  // ... (manter updateLoja, deleteLoja, getLojaById, getAllLojas iguais ao anterior) ...

  async updateLoja(id: string, data: UpdateLojaDTO): Promise<LojaResponseDTO> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Loja não encontrada.", 404);

    if (data.cnpj_cpf && data.cnpj_cpf !== existing.cnpj_cpf) {
      const docExists = await this.repo.findByDoc(data.cnpj_cpf);
      if (docExists && docExists.id_loja !== id) {
        if (docExists.admin_user_id !== existing.admin_user_id) {
          throw new AppError("Este documento já pertence a outra rede.", 409);
        }
      }
    }

    const updated = await this.repo.update(id, data);

    if (data.actorUserId) {
      await this.logService.logSystem({
        id_user: data.actorUserId,
        acao: "ATUALIZAR_LOJA",
        detalhes: `Loja ${id} atualizada.`,
      });
    }

    return updated;
  }

  async deleteLoja(id: string, actorUserId: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Loja não encontrada.", 404);

    await this.repo.delete(id);

    await this.logService.logSystem({
      id_user: actorUserId,
      acao: "DELETAR_LOJA",
      detalhes: `Loja removida: ${existing.nome} (${id})`,
    });
  }

  async getLojaById(id: string): Promise<LojaResponseDTO> {
    const loja = await this.repo.findById(id);
    if (!loja) throw new AppError("Loja não encontrada.", 404);
    return loja;
  }

  async getAllLojas(): Promise<LojaResponseDTO[]> {
    return this.repo.findAll();
  }
}
