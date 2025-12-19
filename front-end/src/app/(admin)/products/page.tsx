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
import ProductCard from "./../../../features/products/ProductCard";
import AddProductModal from "./../../../features/products/AddProductModal";
import ProductDetailModal from "./../../../features/products/ProductDetailModal";
import { Product } from "./../../../features/products/types/index";
import { PaginatedResponse } from "@/types/api";
const LIMIT = 8; // Produtos por página

const ProductsPage = () => {
  const router = useRouter();

  // Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Paginação e Busca
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  // --- 1. Auth Check ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setCheckingAuth(false);
    fetchProducts(1);
  }, [router]);

  // --- 2. Fetch Data ---
  const fetchProducts = async (page = 1, term = "") => {
    setLoading(true);
    try {
      let url = `/products/paginated?page=${page}&perPage=${LIMIT}`;
      if (term) {
        url = `/products/search?term=${encodeURIComponent(
          term
        )}&page=${page}&perPage=${LIMIT}`;
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
  };

  const handleSearch = () => fetchProducts(1, searchTerm);
  const handleClearSearch = () => {
    setSearchTerm("");
    fetchProducts(1, "");
  };
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages)
      fetchProducts(newPage, searchTerm);
  };
  const handleRefresh = () => {
    fetchProducts(currentPage, searchTerm);
    setIsAddModalOpen(false);
    setSelectedProductId(null);
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
            {/* Barra de Ferramentas */}
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
                    placeholder="Buscar produto por nome, ref..."
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
                <FontAwesomeIcon icon={faPlus} className="me-2" /> Novo Produto
              </button>
            </div>

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
                <p className="fs-5 mb-1">Nenhum produto encontrado.</p>
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
