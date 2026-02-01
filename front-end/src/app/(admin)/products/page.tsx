"use client";

import { useEffect, useState, useCallback } from "react";
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

import api from "../../../utils/api";
import ProductCard from "./../../../features/products/ProductCard";
import AddProductModal from "./../../../features/products/AddProductModal";
import ProductDetailModal from "./../../../features/products/ProductDetailModal";
import { Product } from "./../../../features/products/types/index";
import { PaginatedResponse } from "@/types/api";

const LIMIT = 8;

const ProductsPage = () => {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Estados de Filtro
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState("name_asc");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  // --- 1. Fetch Data ---
  const fetchProducts = useCallback(
    async (page = 1, term = "", order = "name_asc") => {
      setLoading(true);
      try {
        let url = `/products/paginated?page=${page}&perPage=${LIMIT}&orderBy=${order}`;
        if (term) {
          url = `/products/search?term=${encodeURIComponent(
            term,
          )}&page=${page}&perPage=${LIMIT}&orderBy=${order}`;
        }

        const response = await api.get<PaginatedResponse<Product>>(url);
        setProducts(response.data.data);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // --- 2. Auth Check ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setCheckingAuth(false);
    fetchProducts(1, "", "name_asc");
  }, [router, fetchProducts]);

  // --- Handlers ---

  const handleSearch = () => fetchProducts(1, searchTerm, orderBy);

  const handleClearSearchInput = () => {
    setSearchTerm("");
    fetchProducts(1, "", orderBy);
  };

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setOrderBy("name_asc");
    fetchProducts(1, "", "name_asc");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchProducts(newPage, searchTerm, orderBy);
    }
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOrder = e.target.value;
    setOrderBy(newOrder);
    fetchProducts(1, searchTerm, newOrder);
  };

  const handleRefresh = () => {
    fetchProducts(currentPage, searchTerm, orderBy);
    setIsAddModalOpen(false);
    setSelectedProductId(null);
  };

  if (checkingAuth)
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <div className="spinner-border text-secondary" />
      </div>
    );

  // Estilo unificado
  const commonStyle = {
    height: "48px",
    outline: "none",
    boxShadow: "none",
    fontSize: "14px",
  };

  // Verifica se há filtros ativos para habilitar/desabilitar o botão limpar
  const hasActiveFilters = searchTerm !== "" || orderBy !== "name_asc";

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#e9e9e9ff" }}
    >
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
            <h3 className="fw-bold m-0">Gerenciar Produtos</h3>
            <p className="m-0 opacity-75 small">
              Controle de estoque e variações.
            </p>
          </div>

          <div className="p-4">
            {/* --- GRID LAYOUT --- */}
            <div className="row g-2 mb-4 align-items-center">
              {/* 1. BARRA DE PESQUISA (LG: 4, MD: 7, SM: 12) */}
              <div className="col-12 col-md-7 col-lg-4">
                <div className="position-relative w-100">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                    style={{ zIndex: 5 }}
                  />
                  <input
                    type="text"
                    className="form-control form-control-underline2 ps-5 w-100"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    style={commonStyle}
                  />
                  {searchTerm && (
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y me-3 cursor-pointer p-2"
                      onClick={handleClearSearchInput}
                      style={{ zIndex: 5 }}
                    >
                      <FontAwesomeIcon
                        className="text-secondary"
                        icon={faTimes}
                      />
                    </span>
                  )}
                </div>
              </div>

              {/* 2. SELECT (LG: 2, MD: 5, SM: 12) */}
              <div className="col-12 col-md-5 col-lg-2">
                <div className="position-relative w-100">
                  <FontAwesomeIcon
                    icon={faSortAmountDown}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                    style={{ zIndex: 5 }}
                  />
                  <select
                    className="form-control button-bottom-line-rounded ps-5 w-100 cursor-pointer "
                    value={orderBy}
                    onChange={handleOrderChange}
                    style={{
                      ...commonStyle,
                      appearance: "none",
                    }}
                  >
                    <option value="name_asc">Nome (A-Z)</option>
                    <option value="name_desc">Nome (Z-A)</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                    <option value="stock_asc">Menor Estoque</option>
                    <option value="stock_desc">Maior Estoque</option>
                    <option value="newest">Recentes</option>
                    <option value="oldest">Antigos</option>
                  </select>
                </div>
              </div>

              {/* 3. BOTÕES (LG: 2 cada, MD: 4 cada, SM: 4 cada) */}

              {/* Botão Buscar */}
              <div className="col-4 col-md-4 col-lg-2">
                <button
                  className="btn button-bottom-line-rounded w-100 px-0"
                  onClick={handleSearch}
                  style={commonStyle}
                >
                  Buscar
                </button>
              </div>

              {/* Botão Limpar */}
              <div className="col-4 col-md-4 col-lg-2">
                <button
                  className="btn button-bottom-line-rounded w-100 px-0 d-flex align-items-center justify-content-center"
                  onClick={handleClearAllFilters}
                  disabled={!hasActiveFilters} // Desabilita HTML
                  title="Limpar filtros"
                  style={{
                    ...commonStyle,
                    opacity: hasActiveFilters ? 1 : 0.6, // Feedback visual
                    cursor: hasActiveFilters ? "pointer" : "not-allowed",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faEraser}
                    className="me-2 d-none d-lg-inline"
                  />
                  Limpar
                </button>
              </div>

              {/* Botão Novo */}
              <div className="col-4 col-md-4 col-lg-2">
                <button
                  className="btn button-bottom-line-rounded w-100 px-0 text-nowrap"
                  onClick={() => setIsAddModalOpen(true)}
                  style={commonStyle}
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="me-2 d-none d-lg-inline"
                  />
                  Novo
                </button>
              </div>
            </div>
            {/* --- FIM GRID --- */}

            {/* Lista de Produtos */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-secondary" />
                <p className="mt-2 text-muted">Carregando catálogo...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="row g-3">
                  {products.map((prod) => (
                    <div
                      key={prod.id_produto}
                      className="col-12 col-md-6 col-lg-3"
                    >
                      <ProductCard
                        product={prod}
                        onClick={() => setSelectedProductId(prod.id_produto)}
                      />
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                <div className="d-flex justify-content-center align-items-center gap-3 mt-5">
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-none"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  <span className="text-muted small fw-bold">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-none"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-5 text-muted">
                <p className="fs-5 mb-1">Nenhum produto encontrado.</p>
                {/* Botão extra de limpar caso a busca não retorne nada */}
                {hasActiveFilters && (
                  <button
                    className="btn btn-link text-secondary shadow-none"
                    onClick={handleClearAllFilters}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="">© 2025 Sistema VL. Gestão de Produtos.</footer>

      {/* Modais */}
      {isAddModalOpen && (
        <AddProductModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          onClose={() => {
            setSelectedProductId(null);
            handleRefresh();
          }}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default ProductsPage;
