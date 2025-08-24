import { Router } from "express";

// Importa os roteadores específicos de cada funcionalidade
import lojaRoutes from "./loja.routes";
import sessionRoutes from "./session.routes";
import produtoRoutes from "./produto.routes";
import funcionarioRoutes from "./funcionario.routes";
import { variacaoRoutes, produtoVariacaoRouter } from "./variacao.routes";

const routes = Router();

// Rota de teste
routes.get("/", (request, response) => {
  return response.json({ message: "API da VL-Store no ar!" });
});

// Direciona qualquer requisição que comece com /lojas para o arquivo loja.routes.ts
routes.use("/lojas", lojaRoutes);

// Direciona qualquer requisição que comece com /sessions para o arquivo session.routes.ts
routes.use("/sessions", sessionRoutes);

// Direciona qualquer requisição que comece com /produtos para o arquivo produto.routes.ts
routes.use("/produtos", produtoRoutes);

// Direciona qualquer requisição que comece com /variacoes para o arquivo variacao.routes.ts
routes.use("/variacoes", variacaoRoutes);

routes.use("/funcionarios", funcionarioRoutes);
// Usa o roteador para as rotas aninhadas de variações de produtos
// (ex: /produtos/:referencia/variacoes)
routes.use(produtoVariacaoRouter);

export default routes;
