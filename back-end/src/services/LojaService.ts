//src/services/LojaService.ts
import { AppDataSource } from "../database/data-source";
import Loja from "../models/Loja";
import * as bcrypt from "bcryptjs";
import { Not } from "typeorm";
import { ValidationUtils } from "./ValidationUtils";

export interface LojaCreateDTO {
  nome: string;
  senha: string;
  email: string;
  cpfCnpjProprietarioLoja: string;
  dataNascProprietario: Date;
  telefone: string;
}

export type LojaUpdateDTO = Partial<LojaCreateDTO>;

export class LojaService {
  async create(data: LojaCreateDTO): Promise<Omit<Loja, "senha">> {
    // 1. Validações de formato e regras de negócio básicas usando ValidationUtils
    ValidationUtils.validateNewLoja(data);

    const lojaRepository = AppDataSource.getRepository(Loja);

    // 2. Validações de unicidade no banco de dados (email e CPF/CNPJ)
    const lojaExistente = await lojaRepository.findOne({
      where: [
        { email: data.email },
        { cpfCnpjProprietarioLoja: data.cpfCnpjProprietarioLoja },
      ],
    });

    if (lojaExistente) {
      if (lojaExistente.email === data.email) {
        throw new Error("Já existe uma loja com este e-mail.");
      }
      if (
        lojaExistente.cpfCnpjProprietarioLoja === data.cpfCnpjProprietarioLoja
      ) {
        throw new Error("Já existe uma loja com este CPF/CNPJ.");
      }
    }

    // 3. Hash da senha antes de salvar
    const senhaHash = await bcrypt.hash(data.senha, 8);

    // 4. Cria e salva a nova loja
    const novaLoja = lojaRepository.create({
      ...data,
      senha: senhaHash,
    });

    await lojaRepository.save(novaLoja);

    // 5. Retorna o objeto da loja sem a senha
    const { senha, ...lojaSemSenha } = novaLoja;
    return lojaSemSenha;
  }

  async findAll(): Promise<Omit<Loja, "senha">[]> {
    const lojaRepository = AppDataSource.getRepository(Loja);
    const lojas = await lojaRepository.find();

    // Mapeia o array para remover a senha de cada objeto
    return lojas.map((loja: Loja) => {
      const { senha, ...lojaSemSenha } = loja;
      return lojaSemSenha;
    });
  }

  async findById(id: string): Promise<Omit<Loja, "senha">> {
    const lojaRepository = AppDataSource.getRepository(Loja);

    // 1. Usa o método 'findOneBy' para buscar a loja pela sua chave primária
    const loja = await lojaRepository.findOneBy({ id_loja: id });

    // 2. Se nenhuma loja for encontrada com esse ID, lança um erro
    if (!loja) {
      throw new Error("Loja não encontrada.");
    }

    // 3. Remove a senha do objeto antes de retorná-lo
    const { senha, ...lojaSemSenha } = loja;
    return lojaSemSenha;
  }

  async update(id: string, data: LojaUpdateDTO): Promise<Omit<Loja, "senha">> {
    const lojaRepository = AppDataSource.getRepository(Loja);

    // 1. Encontra a loja que será atualizada
    const loja = await lojaRepository.findOneBy({ id_loja: id });
    if (!loja) {
      throw new Error("Loja não encontrada.");
    }

    // 2. Validações condicionais para os campos que estão sendo atualizados
    if (data.nome !== undefined) {
      ValidationUtils.validateNome(data.nome);
    }
    if (data.email !== undefined) {
      ValidationUtils.validateEmail(data.email);
    }
    if (data.telefone !== undefined) {
      ValidationUtils.validateTelefone(data.telefone);
    }
    if (data.cpfCnpjProprietarioLoja !== undefined) {
      ValidationUtils.validateCpfCnpj(data.cpfCnpjProprietarioLoja);
    }
    if (data.dataNascProprietario !== undefined) {
      // Para loja, o proprietário deve ter pelo menos 18 anos
      ValidationUtils.validateDataNascimento(data.dataNascProprietario, 18);
    }

    // 3. Verifica se o novo e-mail já está em uso por OUTRA loja
    if (data.email && data.email !== loja.email) {
      const lojaComMesmoEmail = await lojaRepository.findOne({
        where: { email: data.email, id_loja: Not(id) }, // Procura o email em qualquer loja que NÃO seja a atual
      });
      if (lojaComMesmoEmail) {
        throw new Error("Este e-mail já está em uso por outra loja.");
      }
    }

    // 4. Verifica se o novo CPF/CNPJ já está em uso por OUTRA loja
    if (
      data.cpfCnpjProprietarioLoja &&
      data.cpfCnpjProprietarioLoja !== loja.cpfCnpjProprietarioLoja
    ) {
      const lojaComMesmoCpfCnpj = await lojaRepository.findOne({
        where: {
          cpfCnpjProprietarioLoja: data.cpfCnpjProprietarioLoja,
          id_loja: Not(id),
        },
      });
      if (lojaComMesmoCpfCnpj) {
        throw new Error("Este CPF/CNPJ já está em uso por outra loja.");
      }
    }

    // 5. Verifica se a nova senha precisa ser encriptada
    if (data.senha) {
      ValidationUtils.validateSenha(data.senha); // Valida a nova senha antes de fazer o hash
      data.senha = await bcrypt.hash(data.senha, 8);
    }

    // 6. Mescla os dados antigos com os novos e salva
    lojaRepository.merge(loja, data);
    const lojaAtualizada = await lojaRepository.save(loja);

    // 7. Retorna o objeto da loja atualizada sem a senha
    const { senha, ...lojaSemSenha } = lojaAtualizada;
    return lojaSemSenha;
  }

  async delete(id: string): Promise<void> {
    const lojaRepository = AppDataSource.getRepository(Loja);

    const loja = await lojaRepository.findOneBy({ id_loja: id });
    if (!loja) {
      throw new Error("Loja não encontrada.");
    }

    await lojaRepository.delete(id);
  }
}
