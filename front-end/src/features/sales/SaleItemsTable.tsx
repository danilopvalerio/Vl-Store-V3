import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { CartItem } from "./types";

interface Props {
  items: CartItem[];
  onRemove?: (tempId: string) => void;
  // Função para atualizar o item no estado do pai
  onUpdateItem?: (tempId: string, updates: Partial<CartItem>) => void;
  readOnly?: boolean;
}

const SaleItemsTable = ({
  items,
  onRemove,
  onUpdateItem,
  readOnly = false,
}: Props) => {
  // Helper para recalcular e chamar a atualização
  const handleValueChange = (
    tempId: string,
    field: "desconto_por_item" | "acrescimo_por_item",
    value: string
  ) => {
    if (readOnly || !onUpdateItem) return;

    const numValue = parseFloat(value) || 0;

    // Busca o item atual para ter os valores base
    const item = items.find((i) => i.tempId === tempId);
    if (!item) return;

    const desconto =
      field === "desconto_por_item" ? numValue : item.desconto_por_item || 0;
    const acrescimo =
      field === "acrescimo_por_item" ? numValue : item.acrescimo_por_item || 0;

    // Cálculo: (Preço Unitário - Desconto + Acréscimo)
    // Garante que não fique negativo
    const precoFinalUnitario = Math.max(
      0,
      item.preco_unitario - desconto + acrescimo
    );

    // Novo Subtotal
    const novoSubtotal = precoFinalUnitario * item.quantidade;

    // Envia para o pai atualizar o estado
    onUpdateItem(tempId, {
      [field]: numValue,
      subtotal: novoSubtotal,
    });
  };

  return (
    <div className="table-responsive border rounded bg-white">
      <table className="table table-sm table-hover mb-0 align-middle">
        <thead className="table-light">
          <tr>
            <th className="ps-3 text-secondary small text-uppercase">
              Produto
            </th>
            <th className="text-center text-secondary small text-uppercase">
              Qtd
            </th>
            <th className="text-end text-secondary small text-uppercase">
              Unit.
            </th>
            {/* Colunas de Desconto e Acréscimo */}
            <th
              className="text-center text-secondary small text-uppercase"
              style={{ width: "90px" }}
            >
              Desc.
            </th>
            <th
              className="text-center text-secondary small text-uppercase"
              style={{ width: "90px" }}
            >
              Acrés.
            </th>
            <th className="text-end pe-3 text-secondary small text-uppercase">
              Subtotal
            </th>
            {!readOnly && (
              <th className="text-center" style={{ width: "50px" }}></th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.tempId}>
              <td className="ps-3">
                <div className="fw-bold small text-dark">
                  {item.nome_produto}
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {item.nome_variacao || "-"}
                </div>
              </td>
              <td className="text-center fw-medium">{item.quantidade}</td>
              <td className="text-end small text-muted">
                R$ {item.preco_unitario.toFixed(2)}
              </td>

              {/* Input Desconto */}
              <td className="p-1">
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control text-center text-danger fw-bold border-0 bg-light"
                    placeholder="0.00"
                    min="0"
                    disabled={readOnly}
                    value={item.desconto_por_item || ""}
                    onChange={(e) =>
                      handleValueChange(
                        item.tempId,
                        "desconto_por_item",
                        e.target.value
                      )
                    }
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
              </td>

              {/* Input Acréscimo */}
              <td className="p-1">
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control text-center text-primary fw-bold border-0 bg-light"
                    placeholder="0.00"
                    min="0"
                    disabled={readOnly}
                    value={item.acrescimo_por_item || ""}
                    onChange={(e) =>
                      handleValueChange(
                        item.tempId,
                        "acrescimo_por_item",
                        e.target.value
                      )
                    }
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
              </td>

              <td className="text-end fw-bold pe-3 text-dark">
                R$ {item.subtotal.toFixed(2)}
              </td>
              {!readOnly && onRemove && (
                <td className="text-center">
                  <button
                    className="btn btn-link text-danger p-0 btn-sm hover-scale"
                    onClick={() => onRemove(item.tempId)}
                    title="Remover item"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td
                colSpan={readOnly ? 6 : 7}
                className="text-center py-5 text-muted small"
              >
                Nenhum item adicionado ao carrinho.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SaleItemsTable;
