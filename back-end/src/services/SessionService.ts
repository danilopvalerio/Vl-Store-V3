// src/services/SessionService.ts

import { AppDataSource } from "../database/data-source";
import Loja from "../models/Loja";
import * as bcrypt from "bcryptjs"; // Ferramenta para comparar senhas
import * as jwt from "jsonwebtoken"; // A "fábrica" de tokens

// Define o que o usuário vai nos enviar: um email e uma senha
interface ISessionRequest {
  email: string;
  senha: string;
}

interface LojaDTO {
  idLoja: string;
  nome: string;
  email: string;
  // adicione outros campos públicos que queira expor
}

export class SessionService {
  async create({ email, senha }: ISessionRequest) {
    const lojaRepository = AppDataSource.getRepository(Loja);

    // 1. Vamos ao banco de dados e procuramos uma loja com este e-mail.
    //    Pedimos para o banco incluir a senha na busca, pois normalmente ela fica escondida.
    const loja = await lojaRepository
      .createQueryBuilder("loja")
      .addSelect("loja.senha")
      .where("loja.email = :email", { email })
      .getOne();

    // 2. Se não encontramos nenhuma loja com esse e-mail, é um erro.
    if (!loja) {
      throw new Error("E-mail ou senha incorretos."); // Damos uma mensagem genérica por segurança
    }

    // 3. Comparamos a senha que o usuário enviou ('senha') com a senha
    //    encriptada que está no banco ('loja.senha'). O bcrypt faz isso de forma segura.
    const senhaCorreta = await bcrypt.compare(senha, loja.senha);

    // 4. Se as senhas não batem, é um erro.
    if (!senhaCorreta) {
      throw new Error("E-mail ou senha incorretos.");
    }

    // 5. SUCESSO! O e-mail e a senha estão corretos. Vamos criar o token.
    const token = jwt.sign(
      {
        // CORREÇÃO: Adicionamos o id_loja ao payload (os dados dentro do token).
        // É isso que permite que o authMiddleware o recupere depois.
        id_loja: loja.id_loja,
      },
      process.env.JWT_SECRET as string, // Usamos nosso segredo do .env para "assinar" o token.
      {
        subject: loja.id_loja, // Dizemos que o "dono" deste token é a loja com este ID.
        expiresIn: "1d", // O token será válido por 1 dia.
      }
    );

    const lojaDTO: LojaDTO = {
      idLoja: loja.id_loja,
      nome: loja.nome,
      email: loja.email,
      // coloque outros campos públicos que quiser aqui
    };

    // 6. Devolvemos os dados da loja e o token recém-criado.
    return { loja: lojaDTO, token };
  }
}
