// src/components/common/GenericEntityPage.tsx
"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faSearch,
  faTimes,
  faSortAmountDown,
  faEraser,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";
import { PaginatedResponse } from "@/types/api";

// Definição Genérica de Item
// Compatível com EntityCard (title, subtitle, imageUrl, isActive)
export interface BaseEntity {
  id: string | number;
  title?: string; // Para compatibilidade com EntityCard
  subtitle?: string; // Para compatibilidade com EntityCard
  imageUrl?: string | null; // Para compatibilidade com EntityCard
  isActive?: boolean; // Para compatibilidade com EntityCard
  description?: string;
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface SortOption {
  value: string;
  label: string;
}

interface Props<T> {
  pageTitle: string;
  pageSubtitle?: string;
  apiPath: string; // ex: '/products' ou '/employees'
  sortOptions: SortOption[];

  // Render Props: Como desenhar cada item?
  renderCard: (item: T, onSelect: (id: string | number) => void) => ReactNode;

  // Render Props: Quais formulários abrir?
  renderAddModal?: (onClose: () => void, onSuccess: () => void) => ReactNode;
  renderDetailModal?: (
    selectedId: string | number,
    onClose: () => void,
    onSuccess: () => void,
  ) => ReactNode;

  // Mapear ID (caso seu banco use 'id_produto' em vez de 'id')
  getId: (item: T) => string | number;
}

const LIMIT = 8;

export function GenericEntityPage<T extends BaseEntity>({
  pageTitle,
  pageSubtitle,
  apiPath,
  sortOptions,
  renderCard,
  renderAddModal,
  renderDetailModal,
  getId,
}: Props<T>) {
  const router = useRouter();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState(sortOptions[0]?.value || "name_asc");

  // Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const fetchData = useCallback(
    async (page = 1, term = "", order = orderBy) => {
      setLoading(true);
      try {
        let url = `${apiPath}/paginated?page=${page}&perPage=${LIMIT}&orderBy=${order}`;
        if (term) {
          url = `${apiPath}/search?term=${encodeURIComponent(term)}&page=${page}&perPage=${LIMIT}&orderBy=${order}`;
        }
        const response = await api.get<PaginatedResponse<T>>(url);
        setData(response.data.data);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    },
    [apiPath, orderBy],
  );

  useEffect(() => {
    fetchData(1, "", orderBy);
  }, [fetchData, orderBy]);

  const handleSearch = () => fetchData(1, searchTerm, orderBy);
  const handleRefresh = () => {
    fetchData(currentPage, searchTerm, orderBy);
    setIsAddModalOpen(false);
    setSelectedId(null);
  };
  const handleClear = () => {
    setSearchTerm("");
    setOrderBy(sortOptions[0].value);
    fetchData(1, "", sortOptions[0].value);
  };

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#e9e9e9" }}
    >
      {/* Header */}
      <header className="header-panel bg-gradient-vl d-flex align-items-center bg-dark px-2">
        <button
          className="btn btn-link text-white ms-0"
          onClick={() => router.push("/dashboard")}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="fs-4" />
        </button>
      </header>

      <div className="container my-5 flex-grow-1">
        <div className="bg-white border rounded-4 shadow-sm overflow-hidden">
          <div className="bg-gradient-vl p-4 text-center text-white">
            <h3 className="fw-bold m-0">{pageTitle}</h3>
            {pageSubtitle && (
              <p className="m-0 opacity-75 small">{pageSubtitle}</p>
            )}
          </div>

          <div className="p-4">
            {/* Controles (Search, Sort, Buttons) */}
            <div className="row g-2 mb-4 align-items-center">
              <div className="col-12 col-md-7 col-lg-4 position-relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  style={{ zIndex: 5 }}
                />
                <input
                  className="form-control form-control-underline2 ps-5"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {searchTerm && (
                  <FontAwesomeIcon
                    icon={faTimes}
                    className="position-absolute top-50 end-0 translate-middle-y me-3 cursor-pointer"
                    onClick={() => {
                      setSearchTerm("");
                      fetchData(1, "", orderBy);
                    }}
                    style={{ zIndex: 5 }}
                  />
                )}
              </div>

              <div className="col-12 col-md-5 col-lg-2 position-relative">
                <FontAwesomeIcon
                  icon={faSortAmountDown}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  style={{ zIndex: 5 }}
                />
                <select
                  className="form-control button-bottom-line-rounded ps-5"
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-4 col-lg-2">
                <button
                  className="btn button-bottom-line-rounded w-100"
                  onClick={handleSearch}
                >
                  Buscar
                </button>
              </div>

              <div className="col-6 col-md-4 col-lg-2">
                <button
                  className="btn button-bottom-line-rounded w-100"
                  onClick={handleClear}
                >
                  <FontAwesomeIcon icon={faEraser} className="me-2" /> Limpar
                </button>
              </div>

              {renderAddModal && (
                <div className="col-12 col-md-4 col-lg-2">
                  <button
                    className="btn button-bottom-line-rounded w-100"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" /> Novo
                  </button>
                </div>
              )}
            </div>

            {/* Grid de Cards */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" />
              </div>
            ) : data.length > 0 ? (
              <div className="row g-3">
                {data.map((item) => (
                  <div key={getId(item)} className="col-12 col-md-6 col-lg-3">
                    {renderCard(item, (id) => setSelectedId(id))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                Nenhum registro encontrado.
              </div>
            )}

            {/* Paginação Simples */}
            <div className="d-flex justify-content-center gap-3 mt-5">
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill"
                disabled={currentPage === 1}
                onClick={() => fetchData(currentPage - 1, searchTerm, orderBy)}
              >
                Anterior
              </button>
              <span className="text-muted small align-self-center">
                Página {currentPage} de {totalPages}
              </span>
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill"
                disabled={currentPage === totalPages}
                onClick={() => fetchData(currentPage + 1, searchTerm, orderBy)}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Renderização Condicional de Modais */}
      {isAddModalOpen &&
        renderAddModal &&
        renderAddModal(() => setIsAddModalOpen(false), handleRefresh)}

      {selectedId &&
        renderDetailModal &&
        renderDetailModal(selectedId, () => setSelectedId(null), handleRefresh)}
    </div>
  );
}
