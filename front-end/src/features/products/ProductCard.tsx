// src/features/products/ProductCard.tsx
"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faLayerGroup,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { Product } from "./types/index";

interface Props {
  product: Product;
  onClick: () => void;
}

// CORREÇÃO: Porta 3333
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

const ProductCard = ({ product, onClick }: Props) => {
  const [imageError, setImageError] = useState(false);
  console.log("Product imagem_capa:", product.imagem_capa);
  // Garante que não duplique barras se a env já tiver barra
  const formatUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    const cleanBase = API_BASE_URL.replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  const imageUrl = product.imagem_capa ? formatUrl(product.imagem_capa) : null;

  return (
    <div
      className="card-item-bottom-line-rounded h-100 hover-shadow cursor-pointer overflow-hidden d-flex flex-column"
      onClick={onClick}
      style={{
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        opacity: product.ativo ? 1 : 0.6,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.classList.add("shadow");
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.classList.remove("shadow");
      }}
    >
      {/* Área da Imagem de Capa */}
      <div
        className="w-100 bg-light d-flex align-items-center justify-content-center border-bottom"
        style={{ height: "180px", position: "relative" }}
      >
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={product.nome}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
            onError={() => setImageError(true)}
            loading="eager"
          />
        ) : (
          <div className="text-secondary text-opacity-25">
            <FontAwesomeIcon icon={faImage} size="3x" />
          </div>
        )}

        {!product.ativo && (
          <div
            className="position-absolute top-0 end-0 m-2"
            style={{ zIndex: 10 }}
          >
            <span className="badge bg-danger shadow-sm">INATIVO</span>
          </div>
        )}
      </div>

      <div className="card-body p-3 d-flex flex-column flex-grow-1">
        <div className="mb-2">
          <h6
            className="card-title fw-bold mb-1 text-truncate"
            title={product.nome}
          >
            {product.nome}
          </h6>
          <div className="d-flex gap-2 text-muted small flex-wrap">
            {product.referencia && (
              <span className="badge bg-light text-secondary border">
                {product.referencia}
              </span>
            )}
            {product.categoria && (
              <span
                className="badge bg-light text-secondary border text-truncate"
                style={{ maxWidth: "100px" }}
              >
                {product.categoria}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3 border-top">
          <div
            className="d-flex flex-wrap justify-content-between align-items-center small text-muted gap-2"
            style={{ rowGap: "6px" }}
          >
            <div className="d-flex align-items-center" title="Qtd. Variações">
              <FontAwesomeIcon icon={faLayerGroup} className="me-1" />
              {product.qtd_variacoes || 0}
            </div>

            <div className="d-flex align-items-center" title="Estoque Total">
              <FontAwesomeIcon icon={faBoxOpen} className="me-1" />
              {product.total_estoque || 0}
            </div>

            <div
              className="d-flex align-items-center text-dark fw-bold"
              title="A partir de"
            >
              <span className="me-1 fw-normal text-muted">R$</span>
              {product.menor_valor ? product.menor_valor.toFixed(2) : "0.00"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
