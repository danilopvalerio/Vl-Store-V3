"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUnlock } from "@fortawesome/free-solid-svg-icons";
import { CaixaResponse, DashboardStats } from "./types";

interface Props {
  caixa: CaixaResponse | null;
  stats: DashboardStats | null;
  isClosing: boolean;
  saldoFechamento: number;
  setSaldoFechamento: (val: number) => void;
  setIsClosing: (val: boolean) => void;
  handleToggleStatus: () => void;
}

export const CaixaStatusControls = ({
  caixa,
  stats,
  isClosing,
  saldoFechamento,
  setSaldoFechamento,
  setIsClosing,
  handleToggleStatus,
}: Props) => {
  const toBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
      <div>
        <span className="small text-muted me-2">Saldo Final Registrado:</span>
        <span className="fw-bold font-monospace">
          {caixa?.saldo_final ? toBRL(Number(caixa.saldo_final)) : "--"}
        </span>
        {caixa?.saldo_final != null && stats?.saldo_atual != null && (
          <span
            className="ms-2 fw-bold"
            style={{
              color:
                Number(caixa.saldo_final) < stats.saldo_atual
                  ? "red"
                  : Number(caixa.saldo_final) > stats.saldo_atual
                  ? "green"
                  : "inherit",
            }}
          >
            {Number(caixa.saldo_final) < stats.saldo_atual
              ? `Faltando: ${toBRL(
                  stats.saldo_atual - Number(caixa.saldo_final)
                )}`
              : Number(caixa.saldo_final) > stats.saldo_atual
              ? `Passando: ${toBRL(
                  Number(caixa.saldo_final) - stats.saldo_atual
                )}`
              : ""}
          </span>
        )}
      </div>

      {caixa?.status === "FECHADO" ? (
        <button
          className="btn btn-outline-success btn-sm rounded-pill px-3"
          onClick={handleToggleStatus}
        >
          <FontAwesomeIcon icon={faUnlock} className="me-2" /> Reabrir Caixa
        </button>
      ) : !isClosing ? (
        <button
          className="btn btn-outline-danger btn-sm rounded-pill px-3"
          onClick={() => setIsClosing(true)}
        >
          <FontAwesomeIcon icon={faLock} className="me-2" /> Fechar Caixa
        </button>
      ) : (
        <div className="d-flex align-items-center gap-2 bg-light p-1 px-2 rounded border animate-fade-in">
          <small className="fw-bold text-muted">Conferência:</small>
          <input
            type="number"
            className="form-control form-control-sm border-secondary"
            placeholder="Valor na Gaveta"
            style={{ width: "120px" }}
            value={saldoFechamento}
            onChange={(e) => setSaldoFechamento(Number(e.target.value))}
            autoFocus
          />
          <button
            className="btn btn-success btn-sm py-0 h-100"
            onClick={handleToggleStatus}
          >
            OK
          </button>
          <button
            className="btn btn-link btn-sm text-secondary text-decoration-none py-0"
            onClick={() => setIsClosing(false)}
          >
            X
          </button>
        </div>
      )}
    </div>
  );
};
