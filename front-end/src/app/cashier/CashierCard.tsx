// app/caixas/CaixaCard.tsx
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCashRegister,
  faUser,
  faCalendarAlt,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { CaixaResponse } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  caixa: CaixaResponse;
  onClick: () => void;
}

const CaixaCard = ({ caixa, onClick }: Props) => {
  const isAberto = caixa.status === "ABERTO" || caixa.status === "REABERTO";

  // Conversão de data segura
  const dataAbertura = new Date(caixa.data_abertura);

  // Verifica se a data é válida antes de formatar
  const isValidDate = !isNaN(dataAbertura.getTime());

  const dataFormatada = isValidDate
    ? format(dataAbertura, "dd/MM/yyyy", { locale: ptBR })
    : "--/--/----";

  const horaFormatada = isValidDate
    ? format(dataAbertura, "HH:mm", { locale: ptBR })
    : "--:--";

  return (
    <div
      className="card-item-bottom-line-rounded h-100 hover-shadow cursor-pointer position-relative"
      onClick={onClick}
      style={{
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        borderLeft: isAberto ? "4px solid #198754" : "4px solid #6c757d",
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
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center">
            <div
              className={`rounded d-flex align-items-center justify-content-center me-3 ${
                isAberto
                  ? "bg-success-subtle text-success"
                  : "bg-secondary-subtle text-secondary"
              }`}
              style={{ width: "45px", height: "45px", minWidth: "45px" }}
            >
              <FontAwesomeIcon icon={faCashRegister} className="fs-5" />
            </div>
            <div>
              <h6 className="card-title fw-bold mb-0 text-dark">
                Caixa #{caixa.id_caixa.substring(0, 6).toUpperCase()}
              </h6>
              <span
                className={`badge mt-1 ${
                  isAberto ? "bg-success" : "bg-secondary"
                }`}
              >
                {caixa.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 mb-3">
          <div className="d-flex align-items-center text-muted small mb-2">
            <FontAwesomeIcon icon={faUser} className="me-2 text-secondary" />
            <span className="text-truncate" style={{ maxWidth: "150px" }}>
              {caixa.nome_responsavel || "Sem responsável"}
            </span>
          </div>
          <div className="d-flex align-items-center text-muted small">
            <FontAwesomeIcon
              icon={faCalendarAlt}
              className="me-2 text-secondary"
            />
            <span>{dataFormatada}</span>
            <FontAwesomeIcon
              icon={faClock}
              className="ms-3 me-2 text-secondary"
            />
            <span>{horaFormatada}</span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
          <small className="text-muted fw-bold">Saldo Inicial</small>
          <span className="font-monospace fw-bold text-dark">
            R$ {Number(caixa.saldo_inicial).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CaixaCard;
