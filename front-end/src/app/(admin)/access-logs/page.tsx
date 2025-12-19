"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSearch,
  faTimes,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import api from "../../../utils/api";
import AccessLogRow from "../../../features/access-logs/AccessLogRow";

import { PaginatedResponse } from "@/types/api";
import { AccessLog } from "../../../features/access-logs/types/index";

const LIMIT = 5;

const AccessLogsPage = () => {
  const router = useRouter();

  // Estados
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Função para buscar logs ---
  const fetchLogs = useCallback(
    async (page = 1, term = "") => {
      setLoading(true);
      try {
        let url = `/logs/access?page=${page}&perPage=${LIMIT}`;
        if (term) {
          url = `/logs/access/search?term=${encodeURIComponent(
            term
          )}&page=${page}&perPage=${LIMIT}`;
        }

        const response = await api.get<PaginatedResponse<AccessLog>>(url);
        setLogs(response.data.data);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.log("Erro ao buscar logs:", error);
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // --- Verificação de autenticação ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== "SUPER_ADMIN") {
        alert("Acesso restrito. Apenas SUPER_ADMIN pode visualizar logs.");
        router.push("/dashboard");
        return;
      }
      setCheckingAuth(false);
      fetchLogs(1);
    } catch (error) {
      console.log(error);
      localStorage.clear();
      router.push("/login");
    }
  }, [router, fetchLogs]);

  // --- Handlers ---
  const handleSearch = () => fetchLogs(1, searchTerm);
  const handleClearSearch = () => {
    setSearchTerm("");
    fetchLogs(1, "");
  };
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) fetchLogs(newPage, searchTerm);
  };

  if (checkingAuth) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
        <div className="spinner-border text-secondary" role="status" />
      </div>
    );
  }

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#e9e9e9ff" }}
    >
      {/* Header */}
      <header className="header-panel bg-gradient-vl d-flex align-items-center bg-dark px-2">
        <button
          className="btn btn-link text-white ms-0"
          onClick={() => router.push("/dashboard")}
          title="Voltar ao Menu"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="fs-4" />
        </button>
      </header>

      {/* Conteúdo */}
      <div className="container my-5 flex-grow-1">
        <div className="bg-white border rounded-4 shadow-sm overflow-hidden">
          <div className="bg-gradient-vl p-4 text-center text-white">
            <h3 className="fw-bold m-0">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="me-2 fs-3 opacity-75"
              />
              Logs de Acesso
            </h3>
            <p className="m-0 opacity-75 small">
              Histórico de logins e tentativas de acesso ao sistema.
            </p>
          </div>

          <div className="p-4">
            {/* Busca */}
            <div className="row g-3 mb-4 justify-content-center">
              <div className="col-12 col-md-8 col-lg-6">
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    type="text"
                    className="p-2 ps-5 w-100 form-control-underline2"
                    placeholder="Buscar por IP ou E-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  {searchTerm && (
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y me-3"
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
              <div className="col-12 col-md-2">
                <button
                  className="w-100 button-bottom-line-rounded px-4 py-2"
                  onClick={handleSearch}
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" role="status" />
                <p className="mt-2 text-muted">Carregando logs...</p>
              </div>
            ) : logs.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="text-muted small fw-bold">STATUS</th>
                        <th className="text-muted small fw-bold">
                          DATA / HORA
                        </th>
                        <th className="text-muted small fw-bold">USUÁRIO</th>
                        <th className="text-muted small fw-bold">
                          IP DE ORIGEM
                        </th>
                        <th className="text-muted small fw-bold">
                          DISPOSITIVO
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <AccessLogRow key={log.id_log_acesso} log={log} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                <div className="d-flex justify-content-center align-items-center gap-3 mt-4 border-top pt-4">
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
              <div className="text-center py-5 text-muted">
                <p className="fs-5 mb-1">Nenhum registro encontrado.</p>
                <small>
                  O sistema ainda não registrou acessos com este filtro.
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center py-3 text-muted small">
        © 2025 Sistema VL. Logs de Auditoria.
      </footer>
    </div>
  );
};

export default AccessLogsPage;
