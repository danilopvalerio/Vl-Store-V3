/**
 * src/database/data-source.ts
 *
 * Configuração central do TypeORM para a conexão com o banco de dados.
 * Esta versão utiliza a abordagem mais segura para conexões SSL, lendo
 * o certificado CA diretamente do disco.
 */

// Importa e configura o 'dotenv' para carregar as variáveis de ambiente.
import "dotenv/config";

// Importa os módulos necessários do TypeORM e do Node.js.
import { DataSource } from "typeorm";
import * as fs from "fs"; // Módulo 'File System' para ler arquivos.
import * as path from "path"; // Módulo 'Path' para montar caminhos de arquivo.

// Lógica para definir dinamicamente o caminho das entidades e migrações,
// funcionando tanto em desenvolvimento (.ts) quanto em produção (.js).
const entitiesPath =
  process.env.NODE_ENV === "development"
    ? "src/models/*.ts"
    : "dist/models/*.js";

const migrationsPath =
  process.env.NODE_ENV === "development"
    ? "src/database/migrations/*.ts"
    : "dist/database/migrations/*.js";

// Cria e exporta a instância do DataSource para ser usada na aplicação.
export const AppDataSource = new DataSource({
  // Define o tipo do banco de dados como PostgreSQL.
  type: "postgres",

  // Credenciais de conexão lidas de forma segura do arquivo .env.
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  /**
   * Configuração de SSL Segura (Padrão de Produção).
   * Em vez de desabilitar a verificação com 'rejectUnauthorized: false',
   * nós fornecemos o Certificado de Autoridade (CA) que baixamos da Supabase.
   * O Node.js usará este certificado para validar a autenticidade do servidor.
   */
  ssl: {
    // fs.readFileSync lê o conteúdo do arquivo de certificado.
    // path.join monta o caminho absoluto para o arquivo de forma robusta.
    // __dirname aponta para a pasta do arquivo atual (dist/database).
    // '../../' sobe dois níveis para a raiz do projeto.
    ca: fs
      .readFileSync(path.join(__dirname, "../../prod-ca-2021.crt"))
      .toString(),
  },

  // Garante que o TypeORM não alterará a estrutura do banco automaticamente.
  synchronize: false,

  // Habilita logs detalhados do SQL apenas em ambiente de desenvolvimento.
  logging: process.env.NODE_ENV === "development",

  // Aponta para onde o TypeORM deve encontrar as classes de entidade.
  entities: [entitiesPath],

  // Aponta para onde o TypeORM deve encontrar os arquivos de migração.
  migrations: [migrationsPath],
});
