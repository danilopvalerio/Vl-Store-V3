"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartPlus,
  faCheck,
  faMoneyBillWave,
  faTrash,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";
import api from "../../utils/api";
import {
  CartItem,
  SellerOption,
  CashierOption,
  CreateSalePayload,
} from "./types";
import { UserProfileResponse } from "../cashier/types";
import { PaginatedResponse, ApiErrorResponse } from "@/types/api";

import SelectProductModal from "./SelectProductModal";
import SaleItemsTable from "./SaleItemsTable";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentEntry {
  id: string;
  tipo_pagamento: string;
  valor: number;
}

const AddSaleModal = ({ onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);

  // --- Estados de Configuração ---
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [cashiers, setCashiers] = useState<CashierOption[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>("");
  const [selectedCashierId, setSelectedCashierId] = useState<string>("");

  // --- Estados do Carrinho ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // --- Estados de Pagamento ---
  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [currentMethod, setCurrentMethod] = useState("DINHEIRO");
  const [currentAmount, setCurrentAmount] = useState<number>(0);

  // --- Carregamento Inicial ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const resProfiles = await api.get<
          PaginatedResponse<UserProfileResponse>
        >("/profiles/paginated?perPage=100");
        setSellers(
          resProfiles.data.data.map((p) => ({
            id_user_profile: p.id_user_profile,
            nome: p.nome,
          }))
        );

        const resCaixas = await api.get<PaginatedResponse<CashierOption>>(
          "/caixas?perPage=50"
        );
        const activeCashiers = resCaixas.data.data.filter(
          (c) => c.status === "ABERTO" || c.status === "REABERTO"
        );
        setCashiers(activeCashiers);

        // Sem autoseleção, mantém padrão option 1
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      }
    };
    loadInitialData();
  }, []);

  // --- Handlers ---
  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
  };

  const handleRemoveFromCart = (tempId: string) => {
    setCart((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  // --- NOVO: Handler para atualizar itens na tabela (Desconto/Acréscimo) ---
  const handleUpdateCartItem = (tempId: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, ...updates } : item
      )
    );
  };

  // --- Cálculos ---
  const totalCart = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalFinal = Math.max(0, totalCart - discount);
  const totalPaid = payments.reduce((acc, p) => acc + p.valor, 0);
  const remaining = totalFinal - totalPaid;
  const change = remaining < 0 ? Math.abs(remaining) : 0;

  // Se falta pagar, é PENDENTE
  const isPending = remaining > 0.01;

  useEffect(() => {
    if (remaining > 0) {
      setCurrentAmount(Number(remaining.toFixed(2)));
    } else {
      setCurrentAmount(0);
    }
  }, [remaining]);

  const handleAddPayment = () => {
    if (currentAmount <= 0) return;
    const newPayment: PaymentEntry = {
      id: Math.random().toString(36).substring(7),
      tipo_pagamento: currentMethod,
      valor: currentAmount,
    };
    setPayments([...payments, newPayment]);
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return alert("O carrinho está vazio.");

    // Regra: Se tem pagamento, deve ter caixa
    if (payments.length > 0 && cashiers.length > 0 && !selectedCashierId) {
      return alert("Selecione um caixa para registrar o pagamento.");
    }

    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Usuário não autenticado");
      const user = JSON.parse(userStr);

      // Removemos o envio explícito do status, pois o backend calcula
      const payload: Omit<CreateSalePayload, "status"> = {
        id_loja: user.lojaId,
        actorUserId: user.userId,
        id_vendedor: selectedSellerId || undefined,
        id_caixa: selectedCashierId || undefined,
        id_cliente: undefined,
        desconto_global: discount,
        tipo_venda: "FISICA",

        // Mapeia itens incluindo desconto e acréscimo
        itens: cart.map((item) => ({
          id_variacao: item.id_variacao,
          quantidade: item.quantidade,
          // Garante envio de 0 se undefined
          desconto_por_item: item.desconto_por_item || 0,
          acrescimo_por_item: item.acrescimo_por_item || 0,
        })),

        pagamentos: payments.map((p) => ({
          tipo_pagamento: p.tipo_pagamento,
          valor: p.valor,
        })),
      };

      await api.post("/vendas", payload);
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.message || "Erro ao processar venda.");
      console.log(axiosError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1050,
      }}
    >
      <div
        className="modal-dialog"
        style={{
          width: "95%",
          maxWidth: "1100px",
          height: "90vh",
          margin: "auto",
        }}
      >
        <div
          className="modal-content border-0 shadow-lg d-flex flex-column"
          style={{ height: "100%", maxHeight: "100%", overflow: "hidden" }}
        >
          {/* HEADER FIXO */}
          <div className="modal-header bg-gradient-vl text-white border-0 p-3 flex-shrink-0">
            <h5 className="modal-title fw-bold">
              <FontAwesomeIcon icon={faCartPlus} className="me-2" />
              Nova Venda (PDV)
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          {/* BODY: Ocupa o resto e NÃO rola (overflow-hidden) */}
          <div className="modal-body bg-white p-0 d-flex flex-column flex-md-row overflow-hidden flex-grow-1">
            {/* COLUNA ESQUERDA: Rola internamente */}
            <div className="col-12 col-md-4 bg-light p-3 border-end d-flex flex-column overflow-y-auto h-100">
              {/* Card Configuração */}
              <div className="card border-0 shadow-sm mb-3 flex-shrink-0">
                <div className="card-body p-3">
                  <div className="row g-2">
                    <div className="col-12">
                      <h6 className="fw-bold text-secondary mb-2 small text-uppercase">
                        Caixa responsável pela venda
                      </h6>
                      <select
                        className="form-select form-select-sm"
                        value={selectedCashierId}
                        onChange={(e) => setSelectedCashierId(e.target.value)}
                      >
                        <option value="">Nenhum Caixa selecionado</option>
                        {cashiers.map((c) => (
                          <option key={c.id_caixa} value={c.id_caixa}>
                            CX #{c.id_caixa.substring(0, 3)} -{" "}
                            {c.nome_responsavel}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <h6 className="fw-bold text-secondary mb-2 small text-uppercase">
                        Funcionário Responsável
                      </h6>
                      <select
                        className="form-select form-select-sm"
                        value={selectedSellerId}
                        onChange={(e) => setSelectedSellerId(e.target.value)}
                      >
                        <option value="">Nenhum funcionário selecionado</option>
                        {sellers.map((s) => (
                          <option
                            key={s.id_user_profile}
                            value={s.id_user_profile}
                          >
                            {s.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Pagamentos */}
              <div className="card border-0 shadow-sm flex-grow-1 d-flex flex-column">
                <div className="card-body p-3 d-flex flex-column h-100">
                  <h6 className="fw-bold text-secondary mb-2 small text-uppercase flex-shrink-0">
                    Pagamento
                  </h6>

                  <div className="bg-white p-2 rounded border mb-3 flex-shrink-0">
                    <label className="small text-muted fw-bold">
                      Adicionar Valor
                    </label>
                    <div className="input-group input-group-sm mb-2">
                      <select
                        className="form-select fw-bold text-dark"
                        value={currentMethod}
                        onChange={(e) => setCurrentMethod(e.target.value)}
                      >
                        <option value="DINHEIRO">DINHEIRO</option>
                        <option value="PIX">PIX</option>
                        <option value="CARTAO_CREDITO">CRÉDITO</option>
                        <option value="CARTAO_DEBITO">DÉBITO</option>
                        <option value="CREDIARIO">CREDIÁRIO</option>
                      </select>
                    </div>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">R$</span>
                      <input
                        type="number"
                        className="form-control fw-bold"
                        value={currentAmount}
                        onChange={(e) =>
                          setCurrentAmount(Number(e.target.value))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddPayment()
                        }
                      />
                      <button
                        className="btn btn-success"
                        onClick={handleAddPayment}
                        disabled={currentAmount <= 0}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  </div>

                  {/* Lista de Pagamentos */}
                  <div
                    className="flex-grow-1 overflow-auto mb-3 border rounded bg-white p-2"
                    style={{ maxHeight: "150px", minHeight: "80px" }}
                  >
                    {payments.length === 0 ? (
                      <div className="text-center text-muted small mt-4">
                        Nenhum pagamento adicionado.
                      </div>
                    ) : (
                      <ul className="list-group list-group-flush">
                        {payments.map((p) => (
                          <li
                            key={p.id}
                            className="list-group-item d-flex justify-content-between align-items-center p-2 py-1 small"
                          >
                            <span>
                              <span className="badge bg-secondary me-2">
                                {p.tipo_pagamento}
                              </span>
                              R$ {p.valor.toFixed(2)}
                            </span>
                            <button
                              className="btn btn-link text-danger p-0"
                              onClick={() => handleRemovePayment(p.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} size="sm" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="mt-auto flex-shrink-0">
                    <div className="d-flex justify-content-between mb-1 small text-muted">
                      <span>Subtotal:</span>
                      <span>R$ {totalCart.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small fw-bold">Desconto (R$):</span>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end fw-bold text-danger p-0 pe-1"
                        style={{ width: "70px", height: "24px" }}
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                      />
                    </div>
                    <div className="d-flex justify-content-between mb-1 fw-bold text-dark border-top pt-1">
                      <span>Total Final:</span>
                      <span>R$ {totalFinal.toFixed(2)}</span>
                    </div>

                    <div
                      className={`p-2 rounded text-center border mb-3 mt-2 ${
                        isPending
                          ? "bg-warning-subtle border-warning"
                          : "bg-success-subtle border-success"
                      }`}
                    >
                      {isPending ? (
                        <>
                          <small
                            className="text-warning-emphasis fw-bold text-uppercase d-block"
                            style={{ fontSize: "0.7rem" }}
                          >
                            Falta Pagar
                          </small>
                          <h4 className="fw-bold text-warning-emphasis m-0">
                            R$ {remaining.toFixed(2)}
                          </h4>
                        </>
                      ) : (
                        <>
                          <small
                            className="text-success fw-bold text-uppercase d-block"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {change > 0
                              ? "Troco a Devolver"
                              : "Pago Totalmente"}
                          </small>
                          <h4 className="fw-bold text-success m-0">
                            {change > 0 ? (
                              `R$ ${change.toFixed(2)}`
                            ) : (
                              <FontAwesomeIcon icon={faCheck} />
                            )}
                          </h4>
                        </>
                      )}
                    </div>

                    <button
                      className={`w-100 py-2 rounded-pill fw-bold shadow-sm btn ${
                        isPending ? "btn-warning text-dark" : "button-dark-grey"
                      }`}
                      onClick={handleSubmit}
                      disabled={loading || cart.length === 0}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : (
                        <FontAwesomeIcon
                          icon={faMoneyBillWave}
                          className="me-2"
                        />
                      )}
                      {isPending ? "SALVAR PENDENTE" : "FINALIZAR"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: Rola internamente */}
            <div className="col-12 col-md-8 p-3 bg-white d-flex flex-column overflow-hidden h-100">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
                <h5 className="fw-bold m-0">
                  Itens do Pedido{" "}
                  <small className="text-muted fw-normal ms-2">
                    ({cart.length})
                  </small>
                </h5>
                <button
                  className="button-dark-grey btn-sm rounded-pill px-3"
                  onClick={() => setIsProductModalOpen(true)}
                >
                  <FontAwesomeIcon icon={faCartPlus} className="me-2" />
                  Adicionar produto
                </button>
              </div>
              <div className="flex-grow-1 overflow-auto border rounded bg-light">
                <SaleItemsTable
                  items={cart}
                  onRemove={handleRemoveFromCart}
                  onUpdateItem={handleUpdateCartItem} // <--- Adicionado aqui
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isProductModalOpen && (
        <SelectProductModal
          onClose={() => setIsProductModalOpen(false)}
          onConfirm={handleAddToCart}
        />
      )}
    </div>
  );
};

export default AddSaleModal;
