"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MovimentacaoResponse } from "./types";

interface Props {
  movimentacoes: MovimentacaoResponse[];
  canManage: boolean;
  caixaStatus: string | undefined;
  onDelete: (id: string) => void;
}

export const MovimentacoesTable = ({
  movimentacoes,
  canManage,
  caixaStatus,
  onDelete,
}: Props) => {
  const toBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="table-responsive border rounded mb-3">
      <table className="table table-hover align-middle mb-0 small">
        <thead className="table-light">
          <tr>
            <th className="ps-3">Hora</th>
            <th>Tipo</th>
            <th>Descrição</th>
            <th className="text-end">Valor</th>
            <th className="text-center" style={{ width: "50px" }}>
              Del
            </th>
          </tr>
        </thead>
        <tbody>
          {movimentacoes.map((m) => {
            const date = new Date(m.data_criacao);
            const isValid = !isNaN(date.getTime());
            const isEntrada = m.tipo === "ENTRADA" || m.tipo === "SUPRIMENTO";

            return (
              <tr key={m.id_movimentacao}>
                <td className="ps-3 text-muted">
                  {isValid ? format(date, "HH:mm", { locale: ptBR }) : "--:--"}
                </td>
                <td>
                  <span
                    className={`badge border ${
                      isEntrada
                        ? "bg-success-subtle text-success border-success-subtle"
                        : "bg-danger-subtle text-danger border-danger-subtle"
                    }`}
                  >
                    {m.tipo}
                  </span>
                </td>
                <td
                  className="text-truncate"
                  style={{ maxWidth: "150px" }}
                  title={m.descricao || ""}
                >
                  {m.descricao || "-"}
                </td>
                <td
                  className={`text-end font-monospace fw-bold ${
                    isEntrada ? "text-success" : "text-danger"
                  }`}
                >
                  {isEntrada ? "+" : "-"} {toBRL(Number(m.valor))}
                </td>
                <td className="text-center">
                  {canManage &&
                    caixaStatus !== "FECHADO" &&
                    m.tipo !== "ENTRADA" && (
                      <button
                        className="btn btn-link text-muted p-0 hover-danger"
                        onClick={() => onDelete(m.id_movimentacao)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                </td>
              </tr>
            );
          })}
          {movimentacoes.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-muted py-3">
                Nenhuma movimentação.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
