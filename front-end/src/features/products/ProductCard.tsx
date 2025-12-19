"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faDollarSign,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { Product } from "./types/index";

interface Props {
  product: Product;
  onClick: () => void;
}

const ProductCard = ({ product, onClick }: Props) => {
  return (
    <div
      className="card-item-bottom-line-rounded h-100 hover-shadow cursor-pointer"
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
      <div className="card-body p-4 d-flex flex-column h-100">
        <div className="d-flex align-items-start mb-3">
          <div
            className="rounded bg-light d-flex align-items-center justify-content-center me-3 text-secondary"
            style={{ width: "50px", height: "50px", minWidth: "50px" }}
          >
            <FontAwesomeIcon icon={faBoxOpen} className="fs-4" />
          </div>

          <div className="overflow-hidden">
            <h6
              className="card-title fw-bold mb-1 text-truncate"
              title={product.nome}
            >
              {product.nome}
            </h6>
            <div className="d-flex gap-2 text-muted small">
              {product.referencia && (
                <span className="badge bg-light text-secondary border">
                  Ref: {product.referencia}
                </span>
              )}
              {product.categoria && (
                <span className="badge bg-light text-secondary border">
                  {product.categoria}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-3 border-top">
          <div
            className="d-flex flex-wrap justify-content-between align-items-center small text-muted gap-2"
            style={{ rowGap: "6px" }}
          >
            {/* Variações */}
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faLayerGroup} className="me-1" />
              {product.qtd_variacoes || 0} variações
            </div>

            {/* Total em estoque */}
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faBoxOpen} className="me-1" />
              Estoque: <strong className="ms-1">{product.total_estoque}</strong>
            </div>

            {/* Menor valor */}
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faDollarSign} className="me-1" />
              Menor valor:{" "}
              <strong className="ms-1">{product.menor_valor}</strong>
            </div>
          </div>
        </div>

        {!product.ativo && (
          <div className="position-absolute top-0 end-0 m-2">
            <span className="badge bg-danger">INATIVO</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
