// app/caixas/page.tsx
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
import api from "../../utils/api";
import { getErrorMessage } from "../../utils/errorUtils";
import CaixaCard from "./CashierCard";
import AddCaixaModal from "./AddCashierModal";
import CaixaDetailModal from "./CashierDetailModal";
import { PaginatedResponse, CaixaResponse } from "./types";

const LIMIT = 8;

const CaixasPage = () => {
  const router = useRouter();
  const [caixas, setCaixas] = useState<CaixaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCaixaId, setSelectedCaixaId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setCheckingAuth(false);
    fetchCaixas(1);
  }, [router]);

  const fetchCaixas = async (page = 1, term = "") => {
    setLoading(true);
    try {
      let url = `/caixas?page=${page}&perPage=${LIMIT}`;
      if (term) url += `&term=${encodeURIComponent(term)}`;
      const response = await api.get<PaginatedResponse<CaixaResponse>>(url);

      const sorted = response.data.data.sort((a, b) => {
        if (a.status === "ABERTO" && b.status === "FECHADO") return -1;
        if (a.status === "FECHADO" && b.status === "ABERTO") return 1;
        return 0;
      });

      setCaixas(sorted);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchCaixas(1, searchTerm);
  const handleClearSearch = () => {
    setSearchTerm("");
    fetchCaixas(1, "");
  };
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) fetchCaixas(newPage, searchTerm);
  };
  const handleRefresh = () => {
    fetchCaixas(currentPage, searchTerm);
    setIsAddModalOpen(false);
    setSelectedCaixaId(null);
  };

  if (checkingAuth)
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <div className="spinner-border text-secondary" />
      </div>
    );

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#e9e9e9ff" }}
    >
      <header className="header-panel bg-gradient-vl d-flex align-items-center bg-dark px-2">
        <button
          className="btn btn-link text-white ms-0"
          onClick={() => router.push("/menu")}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="fs-4" />
        </button>
      </header>

      <div className="container my-5 flex-grow-1">
        <div className="bg-white border rounded-4 shadow-sm overflow-hidden">
          <div className="bg-gradient-vl p-4 text-center text-white">
            <h3 className="fw-bold m-0">Controle de Caixas</h3>
            <p className="m-0 opacity-75 small">
              Gerencie aberturas, fechamentos e sangrias.
            </p>
          </div>

          <div className="p-4">
            <div className="row g-3 mb-4 justify-content-evenly align-items-top">
              <div className="col-12 col-md-6 col-lg-5">
                <div className="position-relative mb-3">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    type="text"
                    className="p-2 ps-5 col-12 form-control-underline2"
                    placeholder="Buscar por responsável ou status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  {searchTerm && (
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y me-5 cursor-pointer"
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
              <button
                className="col-12 col-md-2 col-lg-2 button-bottom-line-rounded px-4"
                onClick={handleSearch}
              >
                Buscar
              </button>
              <button
                className="col-12 col-md-3 col-lg-2 button-bottom-line-rounded px-2"
                onClick={() => setIsAddModalOpen(true)}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" /> Abrir Caixa
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" />
                <p className="mt-2 text-muted">Carregando caixas...</p>
              </div>
            ) : caixas.length > 0 ? (
              <>
                <div className="row g-3">
                  {caixas.map((c) => (
                    <div key={c.id_caixa} className="col-12 col-md-6 col-lg-3">
                      <CaixaCard
                        caixa={c}
                        onClick={() => setSelectedCaixaId(c.id_caixa)}
                      />
                    </div>
                  ))}
                </div>
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
              <div className="text-center py-5 text-muted">
                <p className="fs-5 mb-1">Nenhum caixa encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="">© 2025 Sistema VL. Gestão Financeira.</footer>
      {isAddModalOpen && (
        <AddCaixaModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}
      {selectedCaixaId && (
        <CaixaDetailModal
          caixaId={selectedCaixaId}
          onClose={() => setSelectedCaixaId(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default CaixasPage;
