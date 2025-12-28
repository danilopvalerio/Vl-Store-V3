"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";
import { CaixaResponse, DashboardStats } from "./types";

interface Props {
  caixa: CaixaResponse | null;
  stats: DashboardStats | null;
}

export const CaixaStats = ({ caixa, stats }: Props) => {
  const toBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="row g-3 mb-4">
      {/* Coluna 1: Saldo */}
      <div className="col-12 col-md-4">
        <div className="p-3 bg-light rounded border h-100 d-flex flex-column justify-content-between position-relative overflow-hidden">
          <div className="position-absolute end-0 top-0 p-3 opacity-25">
            <FontAwesomeIcon
              icon={faMoneyBillWave}
              size="3x"
              className="text-secondary"
            />
          </div>
          <span className="text-muted small fw-bold text-uppercase">
            Saldo em Caixa
          </span>
          <h3 className="fw-bold text-dark my-2">
            {toBRL(stats?.saldo_atual || 0)}
          </h3>
          <small className="text-muted" style={{ fontSize: "0.8rem" }}>
            Inicial: {toBRL(Number(caixa?.saldo_inicial || 0))}
          </small>
        </div>
      </div>

      {/* Coluna 2: Detalhamento */}
      <div className="col-12 col-md-8">
        <div className="row g-2 h-100">
          <div className="col-6 col-md-3">
            <div className="p-2 bg-success-subtle rounded border border-success-subtle h-100 text-center d-flex flex-column justify-content-evenly align-items-center">
              <span className="d-block text-success small fw-bold mb-1">
                Vendas
              </span>
              <span className="d-block fw-bold text-dark">
                {toBRL(stats?.detalhado.VENDA || 0)}
              </span>

              <span className="small">Vendas totais</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 bg-primary-subtle rounded border border-primary-subtle h-100 text-center d-flex flex-column justify-content-evenly align-items-center">
              <span className="d-block text-primary small fw-bold mb-1">
                Suprimentos
              </span>
              <span className="d-block fw-bold text-dark">
                {toBRL(stats?.detalhado.SUPRIMENTO || 0)}
              </span>

              <span className="small">Reforço de Caixa</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 bg-warning-subtle rounded border border-warning-subtle h-100 text-center d-flex flex-column justify-content-evenly align-items-center">
              <span className="text-warning-emphasis small fw-bold">
                Sangrias
              </span>

              <span className="fw-bold text-dark">
                {toBRL(stats?.detalhado.SANGRIA || 0)}
              </span>

              <span className="small">Retirada do caixa</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-2 bg-danger-subtle rounded border border-danger-subtle h-100 text-center d-flex flex-column justify-content-evenly align-items-center">
              <span className="d-block text-danger small fw-bold mb-1">
                Despesas
              </span>
              <span className="d-block fw-bold text-dark">
                {toBRL(stats?.detalhado.SAIDA || 0)}
              </span>

              <span className="small">Despesas totais</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
