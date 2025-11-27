// app/employees/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

import api from "../../utils/api";
import EmployeeCard from "./EmployeeCard";
import AddEmployeeModal from "./AddEmployeeModal";
import EmployeeDetailModal from "./EmployeeDetailModal";
import { PaginatedResponse, UserProfileResponse } from "./types"; // Importando os tipos definidos

// Interface local para o resumo exibido nos cards
export interface EmployeeSummary {
  id_user_profile: string;
  cpf: string;
  nome: string;
  cargo: string;
}

const LIMIT = 6; // Itens por página

const EmployeePage = () => {
  const router = useRouter();

  // Estados de Dados
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Estados de Paginação e Busca
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );

  // --- 1. Verificação de Autenticação (Client Side) ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== "ADMIN") {
        alert(
          "Acesso negado. Apenas administradores podem gerenciar funcionários."
        );
        router.push("/menu");
        return;
      }
      setCheckingAuth(false);
      fetchEmployees(1); // Carrega dados iniciais
    } catch (error) {
      console.log(error);
      localStorage.clear();
      router.push("/login");
    }
  }, [router]);

  // --- 2. Busca de Dados (API) ---
  const fetchEmployees = async (page = 1, term = "") => {
    setLoading(true);
    try {
      // Define qual endpoint chamar (Busca ou Paginação simples)
      let url = `/profiles/paginated?page=${page}&perPage=${LIMIT}`;
      if (term) {
        url = `/profiles/search?term=${encodeURIComponent(
          term
        )}&page=${page}&perPage=${LIMIT}`;
      }

      // Chama API tipada
      const response = await api.get<PaginatedResponse<UserProfileResponse>>(
        url
      );

      // Mapeia a resposta para o formato simplificado do Card
      const data = response.data.data.map((p) => ({
        id_user_profile: p.id_user_profile,
        cpf: p.cpf_cnpj, // O backend retorna cpf_cnpj
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

  // --- Handlers de Eventos ---

  const handleSearch = () => {
    // Sempre volta para página 1 ao pesquisar
    fetchEmployees(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchEmployees(1, "");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchEmployees(newPage, searchTerm);
    }
  };

  // Callback chamado quando um funcionário é criado/editado/excluído
  const handleRefresh = () => {
    fetchEmployees(currentPage, searchTerm);
    setIsAddModalOpen(false);
    setSelectedProfileId(null);
  };

  // --- Renderização ---

  if (checkingAuth) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header / Navbar Simples */}
      <header className="w-100 bg-white shadow-sm py-3 text-center position-relative">
        <button
          className="btn btn-link text-secondary position-absolute start-0 top-50 translate-middle-y ms-4"
          onClick={() => router.push("/menu")}
          title="Voltar ao Menu"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="fs-4" />
        </button>
        <Image
          src="/images/vl-store-logo.png"
          alt="Logo VL Store"
          width={120}
          height={40}
          className="h-auto"
          priority
        />
      </header>

      <div className="container my-5 flex-grow-1">
        <div className="bg-white rounded-4 shadow-sm overflow-hidden">
          {/* Título com Gradiente */}
          <div className="bg-gradient-vl p-4 text-center text-white">
            <h3 className="fw-bold m-0">Gerenciar Funcionários</h3>
            <p className="m-0 opacity-75 small">
              Visualize, adicione e edite sua equipe.
            </p>
          </div>

          <div className="p-4">
            {/* Barra de Ferramentas: Busca e Botão Adicionar */}
            <div className="row g-3 mb-4 justify-content-evenly align-items-top">
              {/* Campo de Busca */}
              <div className="col-12 col-md-6 col-lg-5">
                <div className="position-relative mb-3">
                  {/* Ícone de Lupa à Esquerda */}
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />

                  {/* Input */}
                  <input
                    type="text"
                    className="p-2 ps-5 col-12 form-control-underline2"
                    placeholder="Buscar por nome, cargo ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />

                  {/* Botão Limpar (X) */}
                  {searchTerm && (
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y me-5"
                      style={{ cursor: "pointer", zIndex: 100 }}
                      onClick={handleClearSearch}
                    >
                      <FontAwesomeIcon
                        className="text-secondary"
                        icon={faTimes}
                      />
                    </span>
                  )}
                </div>
              </div>

              {/* Botão Buscar */}
              <button
                className="col-12 col-md-2 col-lg-2 button-bottom-line-rounded px-4"
                onClick={handleSearch}
              >
                Buscar
              </button>

              {/* Botão Adicionar */}

              <button
                className="col-12 col-md-3 col-lg-2 button-bottom-line-rounded px-2"
                onClick={() => setIsAddModalOpen(true)}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Novo Funcionário
              </button>
            </div>

            {/* Área de Conteúdo (Lista ou Loading) */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" role="status" />
                <p className="mt-2 text-muted">Carregando equipe...</p>
              </div>
            ) : employees.length > 0 ? (
              <>
                {/* Grid de Cards */}
                <div className="row g-3">
                  {employees.map((emp) => (
                    <div
                      key={emp.id_user_profile}
                      className="col-12 col-md-6 col-lg-4"
                    >
                      <EmployeeCard
                        employee={emp}
                        onClick={() =>
                          setSelectedProfileId(emp.id_user_profile)
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Controles de Paginação */}
                <div className="d-flex justify-content-center align-items-center gap-3 mt-5">
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <span className="text-muted small fw-bold">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </button>
                </div>
              </>
            ) : (
              /* Estado Vazio */
              <div className="text-center py-5 text-muted">
                <p className="fs-5 mb-1">Nenhum funcionário encontrado.</p>
                <small>
                  Tente buscar por outro termo ou adicione um novo registro.
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="">
        © 2025 Danilo Valério. Todos os direitos reservados.
      </footer>

      {/* --- MODAIS --- */}

      {/* Modal de Adicionar */}
      {isAddModalOpen && (
        <AddEmployeeModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Modal de Detalhes/Edição */}
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
