// products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { isLoggedIn } from "../../utils/auth";
import ProductCard from "./ProductCardComponent";
import ProductDetailModal from "./ProductDetailModal";
import AddProductModal from "./AddProductModal";

// --- Interfaces ---
interface ProductSummary {
  referencia: string;
  nome: string;
  categoria: string;
  material: string;
  genero: string;
  idLoja: string;
}
interface ProductVariation {
  id_variacao?: string;
  descricao: string;
  quantidade: number;
  valor: number;
}
interface LojaData {
  id_loja: string;
  nome: string;
  email: string;
}
interface ProductDetail extends ProductSummary {
  variacoes: ProductVariation[];
}

const ProductPage = () => {
  const [produtos, setProdutos] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [lojaData, setLojaData] = useState<LojaData | null>(null);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [role, setRole] = useState<"admin" | "employee" | null>(null);

  const router = useRouter();

  // --- Estados para controlar os modais ---
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const LIMIT = 6;

  // --- Navegação ---
  const pushBackToMenu = () => router.push("/menu");

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);

  // --- Busca e Paginação ---
  const handleSearch = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(
        `/produtos/search?term=${encodeURIComponent(
          searchTerm
        )}&page=${page}&limit=${LIMIT}`
      );
      setProdutos(response.data.data);
      setTotalItems(response.data.count);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (page: number) => {
    setLoading(true);
    try {
      const response = await api.get(
        `/produtos/paginated?page=${page}&limit=${LIMIT}`
      );
      setProdutos(response.data.data);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const verify = async () => {
      const logged = await isLoggedIn();
      if (!logged) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get(`/sessions/profile`);
        if (response.status === 200) {
          if (response.data.loja) setLojaData(response.data.loja);
          if (response.data.role) setRole(response.data.role);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setCheckingLogin(false);
      }
    };

    verify();
    fetchProducts(1);
  }, []);

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchProducts(1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      searchTerm.trim() !== ""
        ? handleSearch(nextPage)
        : fetchProducts(nextPage);
    }
  };
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      searchTerm.trim() !== ""
        ? handleSearch(prevPage)
        : fetchProducts(prevPage);
    }
  };
  const handleOpenModal = async (referencia: string) => {
    if (isModalOpening) return;
    setIsModalOpening(true);
    try {
      const response = await api.get(`/produtos/${referencia}`);
      setSelectedProduct(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes do produto:", error);
      alert("Não foi possível carregar os detalhes do produto.");
    } finally {
      setIsModalOpening(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductUpdate = () => {
    fetchProducts(1);
    setIsModalOpen(false);
    setSelectedProduct(null);
    setIsAddModalOpen(false);
    if (searchTerm.trim() !== "") {
      handleSearch(currentPage);
    } else {
      fetchProducts(currentPage);
    }
  };

  if (checkingLogin && loading) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <h5 className="mx-auto bg-light rounded-5 p-3 d-flex align-items-center">
          <span className="spinner me-2"></span>
          Um momento
        </h5>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-between align-items-center flex-column min-vh-100">
      <header className="w-100">
        <div className="header-panel">
          <img
            src="/images/vl-store-logo.svg"
            alt="VL Store Logo"
            className="img logo"
          />
        </div>
      </header>

      {/* Conteúdo principal só se nenhum modal estiver aberto */}
      {!isModalOpen && !isAddModalOpen && (
        <div className="row w-75 dark-shadow overflow-hidden rounded-5 mt-4 mb-4">
          <header className="col-12 d-flex flex-column justify-content-center align-items-center text-center p-4 terciary">
            <h3 className="m-3">Produtos</h3>
          </header>

          <div className="col-12 secondary p-4 d-flex flex-column align-items-center">
            <div className="w-100 mb-3">
              <input
                className="w-100 p-2"
                type="text"
                placeholder="Digite o produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="d-flex gap-2 w-100 flex-wrap justify-content-between">
              <button
                className="css-button-fully-rounded--white col-12 col-md-3 d-flex align-items-center justify-content-center"
                onClick={() => handleSearch()}
              >
                Pesquisar
              </button>
              <button
                className="css-button-fully-rounded--white col-12 col-md-3 d-flex align-items-center justify-content-center"
                onClick={handleClearSearch}
              >
                Limpar
              </button>

              {/* 🔒 Botão Adicionar só para admin */}
              {role === "admin" && (
                <button
                  className="css-button-fully-rounded--white col-12 col-md-3 d-flex align-items-center justify-content-center"
                  onClick={handleOpenAddModal}
                >
                  Adicionar Produto
                </button>
              )}
            </div>

            <div className="w-100 mt-4">
              {loading ? (
                <div className="text-center">
                  <h5 className="mx-auto text-center bg-light rounded-5 p-3 d-flex justify-content-center align-items-center">
                    <span className="spinner me-2"></span>
                    Carregando produtos...
                  </h5>
                </div>
              ) : (
                <div className="row g-4">
                  {produtos.length > 0 ? (
                    produtos.map((produto) => (
                      <div
                        key={produto.referencia}
                        className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch"
                        style={{ cursor: isModalOpening ? "wait" : "pointer" }}
                      >
                        <ProductCard
                          product={produto}
                          onClick={() => handleOpenModal(produto.referencia)}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center">
                      <p>Nenhum produto encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
              <button
                className="css-button-fully-rounded--white d-flex align-items-center justify-content-center"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span>{`${currentPage} de ${totalPages}`}</span>
              <button
                className="css-button-fully-rounded--white d-flex align-items-center justify-content-center"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {!isModalOpen && !isAddModalOpen && (
        <button
          className="return-btn-fixed css-button-fully-rounded--white"
          onClick={pushBackToMenu}
          aria-label="Voltar"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      )}

      {isModalOpen && role && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={handleCloseModal}
          onProductUpdate={handleProductUpdate}
          userRole={role}
        />
      )}

      {/* 🔒 Modal de adicionar só aparece para admin */}
      {isAddModalOpen && role === "admin" && (
        <AddProductModal
          onClose={handleCloseAddModal}
          onSaveSuccess={handleProductUpdate}
        />
      )}

      <footer className="w-100 footer-panel text-center p-3">
        <small>VL Store © {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
};

export default ProductPage;
