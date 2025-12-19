"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave } from "@fortawesome/free-solid-svg-icons";
import { TipoMovimentacao } from "./types";

interface Props {
  newMovTipo: TipoMovimentacao;
  setNewMovTipo: (val: TipoMovimentacao) => void;
  newMovValor: number;
  setNewMovValor: (val: number) => void;
  newMovDesc: string;
  setNewMovDesc: (val: string) => void;
  onSave: () => void;
}

export const MovimentacaoForm = ({
  newMovTipo,
  setNewMovTipo,
  newMovValor,
  setNewMovValor,
  newMovDesc,
  setNewMovDesc,
  onSave,
}: Props) => {
  return (
    <div className="bg-light p-3 rounded mb-3 animate-fade-in border">
      <div className="row g-2">
        <div className="col-md-3">
          <label className="form-label small fw-bold mb-0">Tipo</label>
          <select
            className="form-select form-select-sm"
            value={newMovTipo}
            onChange={(e) => setNewMovTipo(e.target.value as TipoMovimentacao)}
          >
            <option value="SANGRIA">Sangria (Saída)</option>
            <option value="SUPRIMENTO">Suprimento (Entrada)</option>
            <option value="SAIDA">Despesa (Saída)</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small fw-bold mb-0">Valor</label>
          <input
            type="number"
            className="form-control form-control-sm"
            value={newMovValor}
            onChange={(e) => setNewMovValor(Number(e.target.value))}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-bold mb-0">Descrição</label>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Motivo..."
            value={newMovDesc}
            onChange={(e) => setNewMovDesc(e.target.value)}
          />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button className="btn btn-success btn-sm w-100" onClick={onSave}>
            <FontAwesomeIcon icon={faSave} className="me-1" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
