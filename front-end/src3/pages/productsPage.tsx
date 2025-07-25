import { useEffect, useState } from "react";
import axios from "axios";

import ProductCard from "@/ui/components/products/ProductCardComponent";
import { useRouter } from "next/router";
import "../../public/css/products.css";
import "../../public/css/general.css";

const ProductPage = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const LIMIT: number = 6; // Limite fixo de itens por página

  const pushAddProductPage = () => {
    router.push("AddProductPage");
  };

  const pushBackToMenu = () => {
    router.push("menuPage");
  };

  const handleSearch = async (page = 1) => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");

    if (!jwtToken || !userData) {
      router.push("/initialPage");
      return;
    }

    const parsedData = JSON.parse(userData);
    const idLoja = parsedData.id_loja;

    try {
      const response = await axios.get(
        `https://vl-store-v2.onrender.com/api/produtos/loja/${idLoja}/busca/${encodeURIComponent(
          searchTerm
        )}?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      setProdutos(response.data.data);
      setTotalItems(response.data.count);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const fetchProducts = async (page: number) => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");

    if (!jwtToken || !userData) {
      router.push("/initialPage");
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      const idLoja = parsedData.id_loja;

      const response = await axios.get(
        `https://vl-store-v2.onrender.com/api/produtos/loja/${idLoja}/paginado?page=${page}&limit=${LIMIT}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          timeout: 2000,
        }
      );

      setProdutos(response.data.data);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [router]);

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchProducts(1); // Sua função padrão para listar todos os produtos paginados
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      if (searchTerm.trim() !== "") {
        handleSearch(currentPage + 1);
      } else {
        fetchProducts(currentPage + 1);
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      if (searchTerm.trim() !== "") {
        handleSearch(currentPage - 1);
      } else {
        fetchProducts(currentPage - 1);
      }
    }
  };

  return (
    <div className="d-flex justify-content-between align-items-center flex-column">
      <header className="header-panel">
        <button
          id="menu-page-return"
          className="btn primaria position-fixed top-0 end-0 m-2 shadow"
          onClick={pushBackToMenu}
        >
          Voltar
        </button>
        <img className="img logo" src="/vl-store-logo-white.svg" />
      </header>

      <div className="mx-auto product-page d-flex justify-content-center align-items-center terciary p-4 flex-column rounded-5 white-light">
        <h3 className="text-center mb-4">Produtos</h3>
        <div className="row w-100 justify-content-between">
          <div className="p-0 col-12 col-md-12">
            <input
              className="input-form primaria w-100"
              type="text"
              placeholder="Digite o produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn primaria col-12 col-md-3 mt-2"
            onClick={() => handleSearch()}
            disabled={!searchTerm.trim()}
          >
            Pesquisar
          </button>
          <button
            className="btn primaria col-12 col-md-3 mt-2"
            onClick={handleClearSearch}
            disabled={!searchTerm.trim()}
          >
            Limpar
          </button>
          <button
            className="btn primaria col-12 col-md-3 mt-2"
            onClick={pushAddProductPage}
          >
            Adicionar produto
          </button>
        </div>

        <div className="row w-100 gap-3 mt-4 justify-content-center">
          {loading ? (
            <p>Carregando produtos...</p>
          ) : (
            <>
              {produtos.length > 0 ? (
                produtos.map((produto, index) => (
                  <ProductCard key={index} product={produto} />
                ))
              ) : (
                <p>Nenhum produto encontrado</p>
              )}
            </>
          )}
        </div>

        <div className="row w-100 gap-3 justify-content-center mt-4">
          <button
            className="btn col-3 primaria btn-paginacao"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Anterior
          </button>

          <button
            className="btn col-3 primaria btn-paginacao"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Próxima
          </button>
          <span className="text-center">{currentPage}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
