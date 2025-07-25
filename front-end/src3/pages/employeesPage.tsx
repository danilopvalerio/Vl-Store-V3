import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeCard from "@/ui/components/employees/employeeCardComponent";
import { useRouter } from "next/router";
import "../../public/css/products.css";
import "../../public/css/general.css";

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const LIMIT: number = 6;

  const pushAddEmployeePage = () => {
    router.push("AddEmployeePage");
  };

  const pushBackToMenu = () => {
    router.push("menuPage");
  };

  const handleSearch = async (page = 1) => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");

    if (!jwtToken || !userData) {
      router.push("/initialPage");
      return;
    }

    const parsedData = JSON.parse(userData);
    const idLoja = parsedData.id_loja;

    try {
      const response = await axios.get(
        `https://vl-store-v2.onrender.com/api/funcionarios/loja/${idLoja}/busca/${encodeURIComponent(
          searchTerm
        )}?page=${page}&limit=${LIMIT}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      setEmployees(response.data.data);
      setTotalItems(response.data.count);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
    }
  };

  const fetchEmployees = async (page: number) => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");

    if (!jwtToken || !userData) {
      router.push("/initialPage");
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      const idLoja = parsedData.id_loja;

      const response = await axios.get(
        `https://vl-store-v2.onrender.com/api/funcionarios/loja/${idLoja}/paginado?page=${page}&limit=${LIMIT}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          timeout: 2000,
        }
      );

      setEmployees(response.data.data);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
  }, [router]);

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchEmployees(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      if (searchTerm.trim() !== "") {
        handleSearch(currentPage + 1);
      } else {
        fetchEmployees(currentPage + 1);
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      if (searchTerm.trim() !== "") {
        handleSearch(currentPage - 1);
      } else {
        fetchEmployees(currentPage - 1);
      }
    }
  };

  return (
    <div className="d-flex justify-content-between align-items-center flex-column">
      <header className="header-panel">
        <button
          id="menu-page-return"
          className="btn primaria position-fixed top-0 end-0 m-2 shadow"
          onClick={pushBackToMenu}
        >
          Voltar
        </button>
        <img
          className="img logo"
          src="/vl-store-logo-white.svg"
          alt="Logo VL Store"
        />
      </header>

      <div className="mx-auto product-page d-flex justify-content-center align-items-center terciary p-4 flex-column rounded-5 white-light">
        <h3 className="text-center mb-4">Funcionários</h3>
        <div className="row w-100 justify-content-between">
          <div className="p-0 col-12 col-md-12">
            <input
              className="input-form primaria w-100"
              type="text"
              placeholder="Digite o nome do funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn primaria col-12 col-md-3 mt-2"
            onClick={() => handleSearch()}
            disabled={!searchTerm.trim()}
          >
            Pesquisar
          </button>
          <button
            className="btn primaria col-12 col-md-3 mt-2"
            onClick={handleClearSearch}
            disabled={!searchTerm.trim()}
          >
            Limpar
          </button>
          <button
            className="btn primaria col-12 col-md-3 mt-2"
            onClick={pushAddEmployeePage}
          >
            Adicionar funcionário
          </button>
        </div>

        <div className="row w-100 gap-3 mt-4 justify-content-center">
          {loading ? (
            <p>Carregando funcionários...</p>
          ) : (
            <>
              {employees.length > 0 ? (
                employees.map((employee, index) => (
                  <EmployeeCard key={index} employee={employee} />
                ))
              ) : (
                <p>Nenhum funcionário encontrado</p>
              )}
            </>
          )}
        </div>

        <div className="row w-100 gap-3 justify-content-center mt-4">
          <button
            className="btn col-3 primaria btn-paginacao"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Anterior
          </button>

          <button
            className="btn col-3 primaria btn-paginacao"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Próxima
          </button>
          <span className="text-center">
            Página {currentPage} de {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
