import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios, { AxiosError } from "axios"; // 1. CORREÇÃO: Importado o tipo AxiosError
import "../../public/css/products.css";
import "../../public/css/general.css";

// Opcional, mas recomendado: definir a estrutura da resposta de erro da API
interface ErrorResponse {
  message: string;
}

const AddEmployee = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [employeeData, setEmployeeData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    data_nascimento: "",
    role: "funcionario", // Valor padrão
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");

    if (!jwtToken || !userData) {
      router.push("/initialPage");
      return;
    }
    // 2. CORREÇÃO: Adicionada a dependência 'router'
  }, [router]);

  const pushBackToEmployees = () => {
    router.push("/employeesPage");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEmployeeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validações básicas
    if (
      !employeeData.nome ||
      !employeeData.email ||
      !employeeData.cpf ||
      !employeeData.telefone ||
      !employeeData.data_nascimento ||
      !password
    ) {
      setError("Preencha todos os campos obrigatórios.");
      setLoading(false);
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      setLoading(false);
      setTimeout(() => setError(""), 3000);
      return;
    }

    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");

    if (!jwtToken || !userData) {
      router.push("/initialPage");
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      const idLoja = parsedData.id_loja;

      const payload = {
        ...employeeData,
        senha: password,
        id_loja: idLoja,
      };

      const response = await axios.post(
        "https://vl-store-v2.onrender.com/api/funcionarios",
        payload,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          pushBackToEmployees();
        }, 3000);
      }
      // 3. CORREÇÃO: Bloco 'catch' tipado corretamente
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverError = error.response?.data as ErrorResponse;
        const errorMessage =
          serverError?.message || "Erro ao cadastrar funcionário";
        setError(errorMessage);
      } else {
        setError("Ocorreu um erro inesperado.");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEmployeeData({
      nome: "",
      email: "",
      cpf: "",
      telefone: "",
      data_nascimento: "",
      role: "FUNCIONARIO",
    });
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center w-100">
      <div className="product-page d-flex justify-content-center align-items-center terciary p-4 flex-column rounded-5 white-light">
        <h3 className="col-12 text-center">Adicionar Novo Funcionário</h3>

        {success && (
          <div className="alert alert-success col-12 text-center mt-2">
            Funcionário cadastrado com sucesso! Redirecionando...
          </div>
        )}

        {error && (
          <div className="alert alert-danger col-12 text-center mt-2">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="row w-100 justify-content-between"
        >
          <div className="col-12 w-100">
            <div className="row product-info w-100 d-flex justify-content-between align-items-between">
              <div className="mx-auto col-12 p-4 info-base row">
                <h5 className="text-center mb-2">Informações básicas</h5>

                <label className="product-label">Nome Completo*:</label>
                <input
                  className="mb-3 produto-input"
                  name="nome"
                  placeholder="Ex: João da Silva"
                  value={employeeData.nome}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Email*:</label>
                <input
                  className="mb-3 produto-input"
                  type="email"
                  name="email"
                  placeholder="Ex: joao@email.com"
                  value={employeeData.email}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">CPF*:</label>
                <input
                  className="mb-3 produto-input"
                  name="cpf"
                  placeholder="Ex: 12345678900"
                  value={employeeData.cpf}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Telefone*:</label>
                <input
                  className="mb-3 produto-input"
                  name="telefone"
                  placeholder="Ex: 11987654321"
                  value={employeeData.telefone}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Data de Nascimento*:</label>
                <input
                  className="mb-3 produto-input"
                  type="date"
                  name="data_nascimento"
                  value={employeeData.data_nascimento}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Senha*:</label>
                <input
                  className="mb-3 produto-input"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <label className="product-label">Confirmar Senha*:</label>
                <input
                  className="mb-3 produto-input"
                  type="password"
                  placeholder="Confirme a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between w-100 mt-3">
            <button
              type="button"
              className="down-btn btn col-12 col-md-3 primaria"
              onClick={clearForm}
            >
              Limpar
            </button>

            <button
              type="button"
              className="down-btn btn col-12 col-md-3 primaria"
              onClick={pushBackToEmployees}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="down-btn btn col-12 col-md-3 primaria"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Funcionário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
