// src/app.ts

// Carrega as variáveis de ambiente antes de qualquer outra execução.
import "dotenv/config";

// Importação de bibliotecas externas
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

// Importação de módulos internos
import routes from "./routes.index";
import { errorMiddleware } from "./middleware/error.middleware";
import { apiLimiter } from "./middleware/rateLimit.middleware";

// Inicialização da instância da aplicação Express
const app = express();

// =========================================================
// CONFIGURAÇÃO DE SEGURANÇA E REDE
// =========================================================

// Middleware Helmet:
// Configura diversos cabeçalhos HTTP (HTTP Headers) relacionados com a segurança
// para proteção contra vulnerabilidades comuns da web.
app.use(helmet());

// Middleware CORS (Cross-Origin Resource Sharing):
// Define a política de acesso a recursos por origens externas.
// Restringe o acesso à origem especificada e permite o envio de credenciais (cookies).
app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.2.3:3000"],
    credentials: true,
  })
);

// Configuração de Proxy Reverso:
// Habilita a confiança no cabeçalho 'X-Forwarded-For'.
// Essencial em ambientes de cloud (Load Balancers/Proxies) para que o
// IP real do cliente seja identificado corretamente pelos limitadores de taxa.
app.set("trust proxy", "loopback");

// Rate Limiter Global:
// Aplica limitação de requisições a todas as rotas sob o prefixo '/api'.
// Previne abuso da API, scraping excessivo e ataques básicos de negação de serviço (DoS).
app.use("/api", apiLimiter);

// =========================================================
// PARSERS DE DADOS DA REQUISIÇÃO
// =========================================================

// JSON Parser:
// Habilita a interpretação de payloads no formato JSON presentes no corpo da requisição.
app.use(express.json());

// Cookie Parser:
// Realiza a interpretação dos cookies presentes nos cabeçalhos da requisição.
// Necessário para a leitura segura de tokens armazenados (ex: Refresh Token HttpOnly).
app.use(cookieParser());

// =========================================================
// ROTAS DA APLICAÇÃO
// =========================================================

// Montagem das rotas:
// Define o prefixo '/api' para todos os endpoints definidos no módulo de rotas.
app.use("/api", routes);

// =========================================================
// TRATAMENTO DE ERROS (GLOBAL)
// =========================================================

// Middleware de Erro:
// Intercepta exceções não tratadas durante o ciclo de vida da requisição.
// Deve ser registado obrigatoriamente após a definição das rotas.
// Responsável por padronizar a estrutura da resposta de erro enviada ao cliente.
app.use(errorMiddleware);

export default app;
