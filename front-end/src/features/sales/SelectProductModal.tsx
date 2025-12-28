// src/features/sales/SelectProductModal.tsx
"use client";

import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faTimes,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";
import { Product, Variation } from "../products/types";
import { CartItem } from "./types";
import { PaginatedResponse } from "@/types/api";

interface Props {
  onClose: () => void;
  onConfirm: (item: CartItem) => void;
}

const SelectProductModal = ({ onClose, onConfirm }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProds, setLoadingProds] = useState(false);
  const [loadingVars, setLoadingVars] = useState(false);

  // Form de Adição
  const [selectedVarId, setSelectedVarId] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Busca produtos na API
  const fetchProducts = useCallback(async (term: string) => {
    // Permite buscar vazio para limpar/resetar se necessário,
    // mas geralmente queremos evitar busca vazia pesada no modal.
    // Ajuste conforme sua regra de negócio.
    setLoadingProds(true);
    try {
      const url = term
        ? `/products/search?term=${encodeURIComponent(term)}&perPage=10`
        : `/products/paginated?page=1&perPage=10`; // Fallback se limpar busca

      const res = await api.get<PaginatedResponse<Product>>(url);
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProds(false);
    }
  }, []);

  // Handler para limpar busca
  const handleClearSearch = () => {
    setSearchTerm("");
    setProducts([]); // Ou fetchProducts("") se quiser mostrar todos ao limpar
  };

  // Busca variações ao clicar num produto
  const handleSelectProduct = async (prod: Product) => {
    setSelectedProduct(prod);
    setLoadingVars(true);
    setVariations([]); // Limpa anteriores
    setSelectedVarId("");

    try {
      const res = await api.get<PaginatedResponse<Variation>>(
        `/products/${prod.id_produto}/variations`
      );
      setVariations(res.data.data);
      // Auto-selecionar a primeira variação se houver
      if (res.data.data.length > 0) {
        setSelectedVarId(res.data.data[0].id_variacao);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVars(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !selectedVarId) return;

    const variation = variations.find((v) => v.id_variacao === selectedVarId);
    if (!variation) return;

    if (quantity > variation.quantidade) {
      alert(`Estoque insuficiente. Disponível: ${variation.quantidade}`);
      return;
    }

    const item: CartItem = {
      tempId: Math.random().toString(36).substring(2, 9),
      id_variacao: variation.id_variacao,
      nome_produto: selectedProduct.nome,
      nome_variacao: variation.nome,
      quantidade: quantity,
      preco_unitario: Number(variation.valor),
      subtotal: Number(variation.valor) * quantity,
    };

    onConfirm(item);
    setQuantity(1);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      onClick={handleBackdropClick}
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1060,
      }}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "95%",
          maxWidth: "900px",
          height: "90vh",
          margin: "auto",
        }}
      >
        <div
          className="modal-content bg-white rounded shadow-lg overflow-hidden d-flex flex-column border-0"
          style={{ height: "100%" }}
        >
          {/* Header */}
          <div className="modal-header border-bottom bg-light d-flex justify-content-between align-items-center p-3">
            <h5 className="modal-title fw-bold text-secondary m-0">
              <FontAwesomeIcon icon={faBoxOpen} className="me-2" />
              Catálogo de Produtos
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle shadow-sm"
              onClick={onClose}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* BODY RESPONSIVO */}
          <div className="modal-body p-0 d-flex flex-column flex-md-row overflow-y-auto">
            {/* COLUNA ESQUERDA: BUSCA E LISTA */}
            <div
              className="col-12 col-md-5 border-end d-flex flex-column bg-white"
              style={{ minHeight: "400px" }}
            >
              <div className="p-3 border-bottom">
                {/* --- AQUI: BUSCA ESTILIZADA IGUAL AO PRODUCTSPAGE --- */}
                <div className="d-flex gap-2 align-items-center h-100">
                  <div className="position-relative flex-grow-1">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                    />
                    <input
                      type="text"
                      className="form-control form-control-underline2 p-2 ps-5 w-100" // Usa sua classe customizada e padding
                      placeholder="Nome ou Ref..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && fetchProducts(searchTerm)
                      }
                      autoFocus
                    />
                    {searchTerm && (
                      <span
                        className="position-absolute top-50 end-0 translate-middle-y me-3 cursor-pointer"
                        onClick={handleClearSearch}
                      >
                        <FontAwesomeIcon
                          icon={faTimes}
                          className="text-secondary"
                        />
                      </span>
                    )}
                  </div>
                  <button
                    className="button-dark-grey pe-2 ps-2 w-25 h-100 rounded-5" // Mantive estilo botão padrão, mas pode usar button-dark-grey se preferir
                    onClick={() => fetchProducts(searchTerm)}
                    disabled={loadingProds}
                  >
                    Buscar
                  </button>
                </div>
                {/* --- FIM DA BUSCA --- */}
              </div>

              {/* Lista de produtos */}
              <div className="flex-grow-1 p-2 overflow-auto">
                {loadingProds && (
                  <div className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" />
                    Carregando...
                  </div>
                )}
                {!loadingProds && products.length === 0 && (
                  <div className="text-center py-5 text-muted">
                    Digite para buscar produtos.
                  </div>
                )}
                {products.map((p) => (
                  <div
                    key={p.id_produto}
                    className={`p-3 mb-2 border rounded cursor-pointer transition-all ${
                      selectedProduct?.id_produto === p.id_produto
                        ? "bg-primary-white border-secondary shadow-sm"
                        : "bg-white hover-bg-light"
                    }`}
                    onClick={() => handleSelectProduct(p)}
                  >
                    <div className="fw-bold text-dark">{p.nome}</div>
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-muted">
                        Ref: {p.referencia || "-"}
                      </small>
                      <small className="text-muted">{p.categoria}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUNA DIREITA: VARIAÇÕES E ADIÇÃO */}
            <div
              className="col-12 col-md-7 d-flex flex-column bg-light"
              style={{ minHeight: "400px" }}
            >
              {selectedProduct ? (
                <div className="p-4 d-flex flex-column h-100">
                  <div className="mb-4">
                    <h5 className="fw-bold text-primary mb-1">
                      {selectedProduct.nome}
                    </h5>
                    <span className="badge bg-secondary">
                      {selectedProduct.categoria}
                    </span>
                  </div>

                  <div className="flex-grow-1 mb-3 overflow-auto">
                    <label className=" fw-bold text-muted text-uppercase mb-2 d-block">
                      Selecione a Variação
                    </label>

                    {loadingVars ? (
                      <div className="text-center py-4">
                        <div className="spinner-border spinner-border-sm" />
                      </div>
                    ) : variations.length === 0 ? (
                      <div className="alert alert-warning ">
                        Este produto não possui variações cadastradas.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {variations.map((v) => (
                          <label
                            key={v.id_variacao}
                            className={`d-flex align-items-center justify-content-between p-3 border rounded bg-white cursor-pointer ${
                              selectedVarId === v.id_variacao
                                ? "border-success ring-success shadow-sm"
                                : ""
                            }`}
                          >
                            <div className="d-flex align-items-center">
                              <input
                                type="radio"
                                name="variation"
                                className="form-check-input me-3"
                                checked={selectedVarId === v.id_variacao}
                                onChange={() => setSelectedVarId(v.id_variacao)}
                                disabled={v.quantidade <= 0}
                              />
                              <div>
                                <div className="fw-bold text-dark">
                                  {v.nome}
                                </div>
                                <small
                                  className={`${
                                    v.quantidade > 0
                                      ? "text-muted"
                                      : "text-danger"
                                  }`}
                                >
                                  Estoque: {v.quantidade} un
                                </small>
                              </div>
                            </div>
                            <div className="fw-bold text-success fs-6">
                              R$ {Number(v.valor).toFixed(2)}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded border mt-auto shadow-sm">
                    <label className=" fw-bold mb-1">Quantidade</label>
                    <div className="d-flex gap-2">
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                      />
                      <button
                        className="btn btn-success px-4 fw-bold"
                        onClick={handleAddItem}
                        disabled={!selectedVarId}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="d-flex h-100 flex-column justify-content-center align-items-center text-muted p-5 text-center">
                  <FontAwesomeIcon
                    icon={faBoxOpen}
                    size="3x"
                    className="mb-3 opacity-25"
                  />
                  <p>
                    Selecione um produto na lista à esquerda para ver suas
                    variações e adicionar ao carrinho.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectProductModal;
