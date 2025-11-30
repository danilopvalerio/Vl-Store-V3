//src/middlewares/rateLimite.middleware.ts
import rateLimit from "express-rate-limit";

// 1. Limiter Geral (Para todas as rotas da API)
// Permite 100 requisições a cada 15 minutos por IP.
// Protege contra sobrecarga (DDoS simples) e scripts de scraping.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 2000,
  message: { error: "Muitas requisições. Tente novamente mais tarde." },
  standardHeaders: true, // Retorna info de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*` antigos
});

// 2. Limiter de Autenticação (Login e Registro)
// Permite apenas 10 tentativas a cada 1 hora.
// Protege contra Força Bruta (tentar descobrir senha na marra).
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // 30 tentativas (Login + Registro)
  message: {
    error: "Muitas tentativas de login/registro. Bloqueado por 1 hora.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
