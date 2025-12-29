"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import api from "../../../utils/api";
import EmployeeCard from "./../../../features/employee/EmployeeCard";
import AddEmployeeModal from "./../../../features/employee/AddEmployeeModal";
import EmployeeDetailModal from "./../../../features/employee/EmployeeDetailModal";
import AddExistingUserProfileModal from "./../../../features/employee/AddExistingUserProfileModal";

import {
  UserProfileResponse,
  EmployeeSummary,
} from "./../../../features/employee/types/index";
import { PaginatedResponse } from "@/types/api";

const LIMIT = 6;

const EmployeePage = () => {
  const router = useRouter();

  // =========================
  // Estados de Dados
  // =========================
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // =========================
  // Paginação e Busca
  // =========================
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // =========================
  // Estados de Modal
  // =========================
  const [isChooseModeOpen, setIsChooseModeOpen] = useState(false);
  const [employeeMode, setEmployeeMode] = useState<
    "NEW_USER" | "EXISTING_USER" | null
  >(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );

  // =========================
  // Auth
  // =========================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        alert("Acesso negado.");
        router.push("/dashboard");
        return;
      }

      setCheckingAuth(false);
      fetchEmployees(1);
    } catch {
      localStorage.clear();
      router.push("/login");
    }
  }, [router]);

  // =========================
  // API
  // =========================
  const fetchEmployees = async (page = 1, term = "") => {
    setLoading(true);

    try {
      let url = `/profiles/paginated?page=${page}&perPage=${LIMIT}`;

      if (term) {
        url = `/profiles/search?term=${encodeURIComponent(
          term
        )}&page=${page}&perPage=${LIMIT}`;
      }

      const response = await api.get<PaginatedResponse<UserProfileResponse>>(
        url
      );

      const data = response.data.data.map((p) => ({
        id_user_profile: p.id_user_profile,
        cpf: p.cpf_cnpj,
        nome: p.nome,
        cargo: p.cargo,
      }));

      setEmployees(data);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Handlers
  // =========================
  const handleSearch = () => {
    fetchEmployees(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchEmployees(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchEmployees(page, searchTerm);
    }
  };

  const handleRefresh = () => {
    fetchEmployees(currentPage, searchTerm);
    setIsAddModalOpen(false);
    setEmployeeMode(null);
    setSelectedProfileId(null);
  };

  // =========================
  // Render
  // =========================
  if (checkingAuth) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
        <div className="spinner-border text-secondary" />
      </div>
    );
  }

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ background: "#e9e9e9" }}
    >
      {/* Header */}
      <header className="header-panel bg-gradient-vl d-flex align-items-center px-2">
        <button
          className="btn btn-link text-white"
          onClick={() => router.push("/dashboard")}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="fs-4" />
        </button>
      </header>

      <div className="container my-5 flex-grow-1">
        <div className="bg-white border rounded-4 shadow-sm">
          <div className="bg-gradient-vl p-4 text-center text-white">
            <h3 className="fw-bold">Gerenciar Funcionários</h3>
            <p className="opacity-75 small">
              Visualize, adicione e edite sua equipe
            </p>
          </div>

          <div className="p-4">
            {/* Toolbar */}
            <div className="row g-3 mb-4 align-items-end">
              <div className="col-md-6">
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="form-control ps-5"
                    placeholder="Buscar por nome, cargo ou CPF"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  {searchTerm && (
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y me-3"
                      onClick={handleClearSearch}
                      style={{ cursor: "pointer" }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </span>
                  )}
                </div>
              </div>

              <div className="col-md-2">
                <button
                  className="button-bottom-line-rounded w-100"
                  onClick={handleSearch}
                >
                  Buscar
                </button>
              </div>

              <div className="col-md-4">
                <button
                  className="button-bottom-line-rounded w-100"
                  onClick={() => setIsChooseModeOpen(true)}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Novo Funcionário
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" />
              </div>
            ) : employees.length ? (
              <>
                <div className="row g-3">
                  {employees.map((emp) => (
                    <div key={emp.id_user_profile} className="col-md-4">
                      <EmployeeCard
                        employee={emp}
                        onClick={() =>
                          setSelectedProfileId(emp.id_user_profile)
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-center gap-3 mt-4">
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Anterior
                  </button>
                  <span className="fw-bold small">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-muted py-5">
                Nenhum funcionário encontrado
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ========================= MODAIS ========================= */}

      {/* Escolha de tipo */}
      {isChooseModeOpen && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5>Novo Funcionário</h5>
                <button
                  className="btn-close"
                  onClick={() => setIsChooseModeOpen(false)}
                />
              </div>
              <div className="modal-body d-flex flex-column gap-3">
                <button
                  className="button-dark-grey rounded-pill px-3"
                  onClick={() => {
                    setEmployeeMode("NEW_USER");
                    setIsChooseModeOpen(false);
                    setIsAddModalOpen(true);
                  }}
                >
                  Criar usuário novo
                </button>

                <button
                  className="button-dark-grey rounded-pill px-3"
                  onClick={() => {
                    setEmployeeMode("EXISTING_USER");
                    setIsChooseModeOpen(false);
                  }}
                >
                  Criar perfil para usuário existente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <AddEmployeeModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}

      {employeeMode === "EXISTING_USER" && (
        <AddExistingUserProfileModal
          onClose={() => setEmployeeMode(null)}
          onSuccess={handleRefresh}
        />
      )}

      {selectedProfileId && (
        <EmployeeDetailModal
          profileId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default EmployeePage;
