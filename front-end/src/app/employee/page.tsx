// app/employees/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { isLoggedIn } from "../../utils/auth";
import EmployeeCard from "./EmployeeCard";
import EmployeeDetailModal from "./EmployeeDetailModal";
import AddEmployeeModal from "./AddEmployeeModal";

// --- Interfaces ---
interface EmployeeSummary {
  cpf: string;
  nome: string;
  email: string;
  cargo: string;
}

// Extends summary for detail view
interface EmployeeDetail extends EmployeeSummary {
  dataNascimento: string; // Comes as string from API
  telefone: string;
}

const EmployeePage = () => {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [role, setRole] = useState<"admin" | "employee" | null>(null);

  const router = useRouter();

  // --- Modal States ---
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const LIMIT = 6;

  // --- Navigation ---
  const pushBackToMenu = () => router.push("/menu");

  // --- API Calls & Data Handling ---
  const fetchEmployees = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get(
        `/funcionarios/paginated?page=${page}&limit=${LIMIT}`
      );
      setEmployees(response.data.data);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (page = 1) => {
    if (searchTerm.trim() === "") {
      fetchEmployees(page);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(
        `/funcionarios/search?term=${encodeURIComponent(
          searchTerm
        )}&page=${page}&limit=${LIMIT}`
      );
      setEmployees(response.data.data);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const verifyAuthAndFetchData = async () => {
      const logged = await isLoggedIn();
      if (!logged) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get(`/sessions/profile`);
        if (response.data.role !== "admin") {
          // 🔒 SECURITY: Redirect if not an admin
          alert("Acesso restrito a administradores.");
          router.push("/menu");
          return;
        }
        setRole(response.data.role);
        // Fetch data only after confirming admin role
        await fetchEmployees(1);
      } catch (error) {
        console.error("Erro ao verificar perfil ou carregar dados:", error);
        router.push("/login"); // Redirect on error
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyAuthAndFetchData();
  }, [router]);

  // --- Event Handlers ---
  const handleClearSearch = () => {
    setSearchTerm("");
    fetchEmployees(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      searchTerm.trim() !== ""
        ? handleSearch(nextPage)
        : fetchEmployees(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      searchTerm.trim() !== ""
        ? handleSearch(prevPage)
        : fetchEmployees(prevPage);
    }
  };

  const handleOpenDetailModal = async (cpf: string) => {
    try {
      const response = await api.get(`/funcionarios/${cpf}`);
      setSelectedEmployee(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes do funcionário:", error);
      alert("Não foi possível carregar os detalhes do funcionário.");
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  const handleEmployeeUpdate = () => {
    setIsAddModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedEmployee(null);
    // Refetch current page to show changes
    searchTerm.trim() !== ""
      ? handleSearch(currentPage)
      : fetchEmployees(currentPage);
  };

  if (checkingAuth) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <h5 className="mx-auto bg-light rounded-5 p-3 d-flex align-items-center">
          <span className="spinner me-2"></span>
          Verificando permissões...
        </h5>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-between align-items-center flex-column min-vh-100">
      <header className="w-100 header-panel">
        <img
          src="/images/vl-store-logo.svg"
          alt="VL Store Logo"
          className="img logo"
        />
      </header>

      {/* Main content is hidden when modals are open */}
      {!isDetailModalOpen && !isAddModalOpen && (
        <div className="row w-75 dark-shadow overflow-hidden rounded-5 mt-4 mb-4">
          <header className="col-12 d-flex flex-column justify-content-center align-items-center text-center p-4 terciary">
            <h3 className="m-3">Funcionários</h3>
          </header>

          <div className="col-12 secondary p-4 d-flex flex-column align-items-center">
            {/* Search and Action Buttons */}
            <div className="w-100 mb-3">
              <input
                className="w-100 p-2"
                type="text"
                placeholder="Buscar por nome, CPF ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="d-flex gap-2 w-100 flex-wrap justify-content-between">
              <button
                className="css-button-fully-rounded--white col-12 col-md-3"
                onClick={() => handleSearch()}
              >
                Pesquisar
              </button>
              <button
                className="css-button-fully-rounded--white col-12 col-md-3"
                onClick={handleClearSearch}
              >
                Limpar
              </button>
              <button
                className="css-button-fully-rounded--white col-12 col-md-3"
                onClick={handleOpenAddModal}
              >
                Adicionar Funcionário
              </button>
            </div>

            {/* Employee List */}
            <div className="w-100 mt-4">
              {loading ? (
                <div className="text-center">
                  <h5 className="mx-auto bg-light rounded-5 p-3 d-flex justify-content-center align-items-center">
                    <span className="spinner me-2"></span>
                    Carregando funcionários...
                  </h5>
                </div>
              ) : (
                <div className="row g-4">
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <div
                        key={employee.cpf}
                        className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch"
                      >
                        <EmployeeCard
                          employee={employee}
                          onClick={() => handleOpenDetailModal(employee.cpf)}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center">
                      <p>Nenhum funcionário encontrado.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
              <button
                className="css-button-fully-rounded--white"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span>{`${currentPage} de ${totalPages}`}</span>
              <button
                className="css-button-fully-rounded--white"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Button */}
      {!isDetailModalOpen && !isAddModalOpen && (
        <button
          className="return-btn-fixed css-button-fully-rounded--white"
          onClick={pushBackToMenu}
          aria-label="Voltar"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      )}

      {/* Modals */}
      {isDetailModalOpen && selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={handleCloseDetailModal}
          onUpdate={handleEmployeeUpdate}
        />
      )}

      {isAddModalOpen && (
        <AddEmployeeModal
          onClose={handleCloseAddModal}
          onSaveSuccess={handleEmployeeUpdate}
        />
      )}

      <footer className="w-100 footer-panel text-center p-3">
        <small>VL Store © {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
};

export default EmployeePage;
