"use client";

import { useState, useEffect, useCallback } from "react";
import { AxiosError } from "axios";
import api from "../../utils/api";
import { Product } from "./types/index";
import { ApiErrorResponse } from "../../types/api";

import ProductForm from "./ProductForm";
import ProductVariations from "./ProductVariations";

interface Props {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductDetailModal = ({ productId, onClose, onSuccess }: Props) => {
  const [productData, setProductData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await api.get<Product>(`/products/${productId}`);
      setProductData(res.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || "Erro ao carregar produto."
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (loading) {
    return (
      <div className="modal-backdrop show d-flex justify-content-center align-items-center bg-dark bg-opacity-50">
        <div className="spinner-border text-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-backdrop show d-flex justify-content-center align-items-center bg-dark bg-opacity-50">
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-danger mb-3">{error}</p>
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog detail-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content w-100 border-0 shadow">
          {/* HEADER */}
          <div className="modal-header w-100 bg-white border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center sticky-top">
            <h5 className="modal-title fw-bold text-secondary">
              Detalhes do Produto
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body w-100 p-4 pt-2">
            {/* COMPONENTE DE FORMULÁRIO DO PRODUTO */}
            {productData && (
              <ProductForm
                product={productData}
                onSuccess={onSuccess}
                onClose={onClose}
              />
            )}

            <hr className="my-4 text-muted" />

            {/* COMPONENTE DE VARIAÇÕES */}
            {/* O ProductVariations gerencia seu próprio estado interno */}
            <ProductVariations productId={productId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
