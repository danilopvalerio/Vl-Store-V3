import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import "../../public/css/products.css";
import "../../public/css/general.css";

const EmployeeDetail = () => {
  const router = useRouter();

  const [employeeData, setEmployeeData] = useState({
    id_funcionario: "",
    nome: "",
    email: "",
    cpf: "",
    data_nascimento: "", // será YYYY-MM-DD
    telefone: "",
    id_loja: "",
  });

  const [error, setError] = useState("");

  // Data original como veio do backend (ex: "0200-07-20T03:06:28.000Z")
  const [originalDate, setOriginalDate] = useState<string>("");

  // Formata data para input type="date"
  const formatDateToInput = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Mantém o horário original, apenas atualiza dia/mês/ano
  const updateDateKeepingTime = (
    originalDateString: string,
    newDateInput: string
  ): string => {
    const original = new Date(originalDateString);
    const [year, month, day] = newDateInput.split("-");

    original.setFullYear(parseInt(year));
    original.setMonth(parseInt(month) - 1); // Mês começa em 0
    original.setDate(parseInt(day));

    return original.toISOString(); // Retorna no formato ISO completo
  };

  // Carrega os dados iniciais
  useEffect(() => {
    const employee = localStorage.getItem("selectedEmployee");
    if (employee) {
      const employeObj = JSON.parse(employee);
      const data = employeObj.data;

      const rawDate = data.data_nascimento;
      setOriginalDate(rawDate);

      setEmployeeData({
        id_funcionario: data.id_funcionario || "",
        nome: data.nome || "",
        email: data.email || "",
        cpf: data.cpf || "",
        data_nascimento: formatDateToInput(rawDate),
        telefone: data.telefone || "",
        id_loja: data.id_loja,
      });
    }
  }, []);

  // Verifica autenticação
  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");
    if (!jwtToken || !userData) router.push("/initialPage");
  }, []);

  const getAuthHeaders = () => {
    const jwtToken = localStorage.getItem("jwtToken");
    return {
      Authorization: `Bearer ${jwtToken}`,
      "Content-Type": "application/json",
    };
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newData = { ...employeeData, [name]: value };
    setEmployeeData(newData);

    try {
      let formattedValue = value;

      if (name === "data_nascimento") {
        formattedValue = updateDateKeepingTime(originalDate, value);
      }

      await axios.patch(
        `https://vl-store-v2.onrender.com/api/funcionarios/loja/${newData.id_loja}/funcionario/${newData.id_funcionario}`,
        { [name]: formattedValue },
        { headers: getAuthHeaders() }
      );
    } catch (err) {
      console.error("Erro ao atualizar funcionário:", err);
      setError("Erro ao atualizar funcionário");
      setTimeout(() => setError(""), 3000);
    }
  };

  const deleteEmployee = async () => {
    try {
      await axios.delete(
        `https://vl-store-v2.onrender.com/api/funcionarios/loja/${employeeData.id_loja}/funcionario/${employeeData.id_funcionario}`,
        { headers: getAuthHeaders() }
      );
      router.push("/employeesPage");
    } catch (err) {
      console.error("Erro ao deletar funcionário:", err);
      setError("Erro ao deletar funcionário");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center w-100">
      <div className="product-page d-flex justify-content-center align-items-center terciary p-4 flex-column rounded-5 white-light">
        <h3 className="col-12 text-center">Editar funcionário</h3>

        {error && (
          <div className="alert alert-danger col-12 text-center mt-2">
            {error}
          </div>
        )}

        <form className="row w-100 justify-content-between">
          <div className="col-12 w-100">
            <div className="row product-info w-100 d-flex justify-content-between align-items-between">
              <div className="mx-auto col-12 p-4 info-base row">
                <h5 className="text-center mb-2">Informações do Funcionário</h5>

                <label className="product-label">Nome*:</label>
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
                  placeholder="Ex: 123.456.789-00"
                  value={employeeData.cpf}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Data de Nascimento*:</label>
                <input
                  type="date"
                  className="mb-3 produto-input"
                  name="data_nascimento"
                  value={employeeData.data_nascimento}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Telefone:</label>
                <input
                  className="mb-3 produto-input"
                  name="telefone"
                  placeholder="Ex: (11) 91234-5678"
                  value={employeeData.telefone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between w-100 mt-3">
            <button
              type="button"
              className="down-btn btn col-12 col-md-3 primaria"
              onClick={() => router.push("/employeesPage")}
            >
              Voltar
            </button>

            <button
              type="button"
              className="down-btn btn col-12 col-md-3 primaria"
              onClick={deleteEmployee}
            >
              Deletar Funcionário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeDetail;
