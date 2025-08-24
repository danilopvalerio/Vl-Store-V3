//src/services/FuncionarioService.ts
import { AppDataSource } from "../database/data-source";
import Funcionario from "../models/Funcionario";
import Loja from "../models/Loja";
import * as bcrypt from "bcryptjs";
import { ValidationUtils } from "./ValidationUtils";
import { Brackets } from "typeorm";

export interface FuncionarioCreateDTO {
  cpf: string;
  nome: string;
  email: string;
  senha: string;
  cargo?: string;
  dataNascimento: Date;
  telefone?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type FuncionarioUpdateDTO = Partial<FuncionarioCreateDTO>;

export class FuncionarioService {
  async create(
    idLoja: string,
    data: FuncionarioCreateDTO
  ): Promise<Omit<Funcionario, "senha">> {
    ValidationUtils.validateCpfCnpj(data.cpf);
    ValidationUtils.validateNome(data.nome);
    ValidationUtils.validateEmail(data.email);
    ValidationUtils.validateSenha(data.senha);
    ValidationUtils.validateDataNascimento(new Date(data.dataNascimento), 16);

    const funcionarioRepository = AppDataSource.getRepository(Funcionario);
    const lojaRepository = AppDataSource.getRepository(Loja);

    const loja = await lojaRepository.findOneBy({ id_loja: idLoja });
    if (!loja) {
      throw new Error("Loja não encontrada.");
    }

    const funcionarioExistente = await funcionarioRepository.findOne({
      where: [{ cpf: data.cpf }, { email: data.email }],
    });

    if (funcionarioExistente) {
      if (funcionarioExistente.cpf === data.cpf) {
        throw new Error("Já existe um funcionário com este CPF.");
      }
      if (funcionarioExistente.email === data.email) {
        throw new Error("Já existe um funcionário com este e-mail.");
      }
    }

    const senhaHash = await bcrypt.hash(data.senha, 8);

    const novoFuncionario = funcionarioRepository.create({
      ...data,
      senha: senhaHash,
      idLoja: idLoja,
    });

    await funcionarioRepository.save(novoFuncionario);

    const { senha, ...funcionarioSemSenha } = novoFuncionario;
    return funcionarioSemSenha;
  }

  async findAll(idLoja: string): Promise<Funcionario[]> {
    const funcionarioRepository = AppDataSource.getRepository(Funcionario);
    return funcionarioRepository.find({ where: { idLoja: idLoja } });
  }

  async findByCpf(idLoja: string, cpf: string): Promise<Funcionario> {
    const funcionarioRepository = AppDataSource.getRepository(Funcionario);
    const funcionario = await funcionarioRepository.findOneBy({
      idLoja: idLoja,
      cpf: cpf,
    });
    if (!funcionario) {
      throw new Error("Funcionário não encontrado.");
    }
    return funcionario;
  }

  async update(
    idLoja: string,
    cpf: string,
    data: FuncionarioUpdateDTO
  ): Promise<Omit<Funcionario, "senha">> {
    const funcionarioRepository = AppDataSource.getRepository(Funcionario);
    const funcionario = await funcionarioRepository.findOneBy({ idLoja, cpf });

    if (!funcionario) {
      throw new Error("Funcionário não encontrado.");
    }

    if (data.senha) {
      ValidationUtils.validateSenha(data.senha);
      data.senha = await bcrypt.hash(data.senha, 8);
    }

    funcionarioRepository.merge(funcionario, data);
    const funcionarioAtualizado = await funcionarioRepository.save(funcionario);

    const { senha, ...funcionarioSemSenha } = funcionarioAtualizado;
    return funcionarioSemSenha;
  }

  async delete(idLoja: string, cpf: string): Promise<void> {
    const funcionarioRepository = AppDataSource.getRepository(Funcionario);
    const result = await funcionarioRepository.delete({ idLoja, cpf });

    if (result.affected === 0) {
      throw new Error("Funcionário não encontrado.");
    }
  }

  async findPaginated(
    idLoja: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Funcionario>> {
    const funcionarioRepository = AppDataSource.getRepository(Funcionario);
    const skip = (page - 1) * limit;

    const [funcionarios, total] = await funcionarioRepository.findAndCount({
      where: { idLoja },
      skip,
      take: limit,
      order: { nome: "ASC" },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: funcionarios,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * NOVO: Busca funcionários por um termo de pesquisa, de forma paginada.
   */
  async search(
    idLoja: string,
    term: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Funcionario>> {
    const funcionarioRepository = AppDataSource.getRepository(Funcionario);
    const skip = (page - 1) * limit;

    const queryBuilder =
      funcionarioRepository.createQueryBuilder("funcionario");

    queryBuilder.where("funcionario.idLoja = :idLoja", { idLoja }).andWhere(
      new Brackets((qb) => {
        const searchTerm = `%${term}%`;
        qb.where("funcionario.nome ILIKE :term", { term: searchTerm })
          .orWhere("funcionario.cpf ILIKE :term", { term: searchTerm })
          .orWhere("funcionario.email ILIKE :term", { term: searchTerm })
          .orWhere("funcionario.cargo ILIKE :term", { term: searchTerm });
      })
    );

    const [funcionarios, total] = await queryBuilder
      .orderBy("funcionario.nome", "ASC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: funcionarios,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
