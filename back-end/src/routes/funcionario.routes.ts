import { Router } from "express";
import { FuncionarioController } from "../controllers/FuncionarioController";
import { authMiddleware } from "../middlewares/authMiddleware";

const funcionarioRoutes = Router();
const funcionarioController = new FuncionarioController();

// Aplica o middleware de autenticação para todas as rotas de funcionário
funcionarioRoutes.use(authMiddleware);

// Rota para buscar funcionários com termo de pesquisa e paginação.
// Ex: GET /api/funcionarios/search?term=joao&page=1&limit=5
funcionarioRoutes.get("/search", funcionarioController.search);

// Rota para listar funcionários de forma paginada.
// Ex: GET /api/funcionarios?page=2&limit=10
funcionarioRoutes.get("/paginated", funcionarioController.findPaginated);

// Rota para criar um novo funcionário para a loja autenticada
funcionarioRoutes.post("/", funcionarioController.create);

// Rota para listar todos os funcionários da loja autenticada
funcionarioRoutes.get("/", funcionarioController.findAll);

// Rota para buscar um funcionário específico pelo CPF
funcionarioRoutes.get("/:cpf", funcionarioController.findByCpf);

// Rota para atualizar um funcionário pelo CPF
funcionarioRoutes.patch("/:cpf", funcionarioController.update);

// Rota para deletar um funcionário pelo CPF
funcionarioRoutes.delete("/:cpf", funcionarioController.delete);

export default funcionarioRoutes;
