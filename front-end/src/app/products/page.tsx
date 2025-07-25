"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import ProductCard from "./ProductCardComponent";

const ProductPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const LIMIT = 6;

  const pushAddProductPage = () => router.push("/AddProductPage");
  const pushBackToMenu = () => router.push("/menu");

  const handleSearch = async (page = 1) => {
    setLoading(true);
    try {
      const userData = sessionStorage.getItem("userData");
      if (!userData) {
        router.push("/login");
        return;
      }

      const parsedData = JSON.parse(userData);
      const idLoja = parsedData.id_loja;

      const response = await api.get(
        `/produtos/loja/${idLoja}/busca/${encodeURIComponent(
          searchTerm
        )}?page=${page}`
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
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      router.push("/login");
    } else {
      fetchProducts(1);
    }
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

  return (
    <div className="d-flex justify-content-between align-items-center flex-column min-vh-100">
      <header className="w-100">
        <div className="header-panel d-flex justify-content-between align-items-center p-2">
          <img
            src="/images/vl-store-logo.svg"
            alt="VL Store Logo"
            className="img logo"
          />
        </div>
      </header>

      <div className="menu row w-75 white-light overflow-hidden rounded-5 mt-4 mb-4">
        <div className="col-12 d-flex flex-column justify-content-center align-items-center text-center p-4 terciary">
          <h3 className="m-3">Produtos</h3>
        </div>

        <div className="col-12 secondary p-4 d-flex flex-column align-items-center">
          <div className="w-100 mb-3">
            <input
              className="input-form primaria p-2 w-100"
              type="text"
              placeholder="Digite o produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="d-flex gap-2 w-100 flex-wrap justify-content-between">
            <button
              className="btn primaria col-12 col-md-3 d-flex align-items-center justify-content-center"
              onClick={() => handleSearch()}
              // disabled={!searchTerm.trim()}
            >
              Pesquisar
            </button>
            <button
              className="btn primaria col-12 col-md-3 d-flex align-items-center justify-content-center"
              onClick={handleClearSearch}
              // disabled={!searchTerm.trim()}
            >
              Limpar
            </button>

            <button
              className="btn primaria col-12 col-md-3 d-flex align-items-center justify-content-center"
              onClick={pushAddProductPage}
            >
              Adicionar Produto
            </button>
          </div>

          <div className="w-100 mt-4">
            {loading ? (
              <p className="text-center">Carregando produtos...</p>
            ) : produtos.length > 0 ? (
              produtos.map((produto, index) => (
                <ProductCard key={index} product={produto} />
              ))
            ) : (
              <p className="text-center">Nenhum produto encontrado</p>
            )}
          </div>

          <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
            <button
              className="btn primaria  d-flex align-items-center justify-content-center"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span>{`${currentPage} de ${totalPages}`}</span>
            <button
              className="btn primaria  d-flex align-items-center justify-content-center"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      <footer className="w-100 footer-panel text-center p-3">
        <small>VL Store © 2025</small>
      </footer>
      <button
        className="btn primaria return-btn-fixed shadow"
        onClick={pushBackToMenu}
        aria-label="Voltar"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
    </div>
  );
};

export default ProductPage;
