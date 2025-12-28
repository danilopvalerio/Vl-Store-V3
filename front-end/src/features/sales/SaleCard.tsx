// src/features/sales/SaleCard.tsx
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReceipt,
  faUser,
  faClock,
  faBan,
  faHourglassHalf, // Ícone para pendente
} from "@fortawesome/free-solid-svg-icons";
import { Sale } from "./types";

interface Props {
  sale: Sale;
  onClick: () => void;
}

const SaleCard = ({ sale, onClick }: Props) => {
  const date = new Date(sale.data_criacao);
  const status = sale.status; // "FINALIZADA" | "CANCELADA" | "PENDENTE"

  // Configuração visual baseada no status
  const getStatusConfig = () => {
    switch (status) {
      case "CANCELADA":
        return {
          colorClass: "bg-danger", // Vermelho
          borderColor: "#dc3545",
          icon: faBan,
          opacity: 0.7,
        };
      case "PENDENTE":
        return {
          colorClass: "bg-warning text-dark", // Amarelo
          borderColor: "#ffc107",
          icon: faHourglassHalf,
          opacity: 1,
        };
      default: // FINALIZADA
        return {
          colorClass: "bg-success", // Verde
          borderColor: "#198754",
          icon: faReceipt,
          opacity: 1,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className="card-item-bottom-line-rounded h-100 hover-shadow cursor-pointer position-relative"
      onClick={onClick}
      style={{
        transition: "transform 0.2s, box-shadow 0.2s",
        borderLeft: `4px solid ${config.borderColor}`,
        opacity: config.opacity,
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
        <div className="d-flex flex-column justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <div
              className={`rounded d-flex align-items-center justify-content-center me-3 text-white ${config.colorClass}`}
              style={{ width: "45px", height: "45px" }}
            >
              <FontAwesomeIcon icon={config.icon} className="fs-5" />
            </div>
            <div>
              <h6 className="fw-bold mb-0 text-dark">
                #{sale.id_venda.substring(0, 8)}
              </h6>
              <span className={`badge ${config.colorClass} small mt-1`}>
                {status}
              </span>
            </div>
          </div>

          <div className="text-end mt-3 w-100">
            <div className="d-flex justify-content-between align-items-baseline">
              <span className="text-muted small fw-bold text-uppercase">
                Total
              </span>
              <span className="fs-5 fw-bold text-dark">
                R$ {Number(sale.total_final).toFixed(2)}
              </span>
            </div>

            {/* Se for pendente, mostra quanto já foi pago */}
            {status === "PENDENTE" && (
              <div className="d-flex justify-content-between align-items-center mt-1">
                <span
                  className="text-muted small"
                  style={{ fontSize: "0.75rem" }}
                >
                  Pago:
                </span>
                <span className="text-success fw-bold small">
                  R$ {Number(sale.valor_pago).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center text-muted small">
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faUser} className="me-2 text-secondary" />
            <span
              className="text-truncate"
              style={{ maxWidth: "120px" }}
              title={sale.nome_vendedor || "Venda Direta"}
            >
              {sale.nome_vendedor || "Venda Direta"}
            </span>
          </div>
          <div className="d-flex align-items-center">
            <FontAwesomeIcon icon={faClock} className="me-2 text-secondary" />
            {date.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleCard;
