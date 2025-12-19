"use client";

import { useState, useEffect, useCallback } from "react";
import { AxiosError } from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPlus,
  faUserEdit,
  faSearch,
  faCashRegister,
} from "@fortawesome/free-solid-svg-icons";

// Imports
import api from "../../utils/api";
import { ApiErrorResponse, PaginatedResponse } from "../../types/api";
import {
  CaixaResponse,
  MovimentacaoResponse,
  TipoMovimentacao,
  UserProfileResponse,
  ToggleStatusPayload,
  UpdateResponsiblePayload,
  CaixaDashboardResponse,
  DashboardStats,
} from "./types";

// Import dos Sub-componentes
import { CaixaStats } from "./CaixaStats";
import { CaixaStatusControls } from "./CaixaStatusControls";
import { MovimentacaoForm } from "./MovimentacaoForm";
import { MovimentacoesTable } from "./MovimentacoesTable";

const faUserExchange = faUserEdit;

interface Props {
  caixaId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CaixaDetailModal = ({ caixaId, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(true);

  // --- Estados ---
  const [caixa, setCaixa] = useState<CaixaResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [canManage, setCanManage] = useState(false);

  // Movimentações
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoResponse[]>(
    []
  );
  const [movPage, setMovPage] = useState(1);
  const [movTotalPages, setMovTotalPages] = useState(1);

  // UI States
  const [isAddingMov, setIsAddingMov] = useState(false);
  const [isChangingUser, setIsChangingUser] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Form Movimentação
  const [newMovTipo, setNewMovTipo] = useState<TipoMovimentacao>("SANGRIA");
  const [newMovValor, setNewMovValor] = useState(0);
  const [newMovDesc, setNewMovDesc] = useState("");

  // Fechamento / Troca Resp
  const [saldoFechamento, setSaldoFechamento] = useState(0);
  const [users, setUsers] = useState<UserProfileResponse[]>([]);

  // --- API Calls & Loaders ---

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get<CaixaDashboardResponse>(
        `/caixas/${caixaId}/dashboard`
      );
      setCaixa(res.data.caixa);
      setStats(res.data.estatisticas);

      if (res.data.estatisticas) {
        setSaldoFechamento(res.data.estatisticas.saldo_atual);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(
        axiosError.response?.data?.message ||
          "Erro ao carregar detalhes do caixa"
      );
    } finally {
      setLoading(false);
    }
  }, [caixaId]);

  const loadMovimentacoes = useCallback(
    async (page = 1) => {
      try {
        const url = `/caixas/movimentacoes?caixaId=${caixaId}&page=${page}&perPage=5`;
        const res = await api.get<PaginatedResponse<MovimentacaoResponse>>(url);
        setMovimentacoes(res.data.data);
        setMovTotalPages(res.data.totalPages);
        setMovPage(res.data.page);
      } catch (err) {
        console.error("Erro ao carregar movimentações", err);
      }
    },
    [caixaId]
  );

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCanManage(["ADMIN", "SUPER_ADMIN", "GERENTE"].includes(user.role));
    }
    loadDashboard();
    loadMovimentacoes(1);
  }, [loadDashboard, loadMovimentacoes]);

  // --- Handlers ---

  const handleAddMovimentacao = async () => {
    if (newMovValor <= 0) return alert("Valor inválido");
    try {
      await api.post("/caixas/movimentacoes", {
        id_caixa: caixaId,
        tipo: newMovTipo,
        valor: newMovValor,
        descricao: newMovDesc,
      });
      setIsAddingMov(false);
      setNewMovValor(0);
      setNewMovDesc("");

      await loadDashboard();
      loadMovimentacoes(1);

      setSuccessMsg("Movimentação registrada!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(
        axiosError.response?.data?.message || "Erro ao adicionar movimentação"
      );
    }
  };

  const handleDeleteMov = async (id: string) => {
    if (!confirm("Tem certeza? Isso altera o saldo do caixa.")) return;
    try {
      await api.delete(`/caixas/movimentacoes/${id}`);
      await loadDashboard();
      loadMovimentacoes(movPage);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(
        axiosError.response?.data?.message || "Erro ao deletar movimentação"
      );
    }
  };

  const handleToggleStatus = async () => {
    try {
      const payload: ToggleStatusPayload = {};
      if (caixa?.status === "ABERTO" || caixa?.status === "REABERTO") {
        payload.saldo_final = saldoFechamento;
      }

      await api.patch(`/caixas/${caixaId}/status`, payload);
      await loadDashboard();
      setIsClosing(false);
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.message || "Erro ao alterar status");
    }
  };

  const searchUsers = async (term: string) => {
    if (!term) return;
    try {
      const res = await api.get<PaginatedResponse<UserProfileResponse>>(
        `/profiles/search?term=${term}&perPage=5`
      );
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeResponsible = async (userId: string) => {
    if (!confirm("Confirmar troca de responsável?")) return;
    try {
      const payload: UpdateResponsiblePayload = { id_user_profile: userId };
      await api.patch(`/caixas/${caixaId}/responsible`, payload);
      setIsChangingUser(false);
      await loadDashboard();
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.message || "Erro ao trocar responsável");
    }
  };

  if (loading)
    return <div className="modal-backdrop show bg-dark bg-opacity-50" />;

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog detail-box"
        style={{ maxWidth: "900px", width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow">
          {/* HEADER (Mantive aqui pois tem a lógica de busca de usuário flutuante) */}
          <div className="modal-header border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="modal-title fw-bold text-secondary">
                <FontAwesomeIcon
                  icon={faCashRegister}
                  className="me-2 text-muted"
                />
                Painel do Caixa
              </h5>
              <div className="d-flex align-items-center gap-2 mt-1">
                <span
                  className={`badge ${
                    caixa?.status === "FECHADO" ? "bg-secondary" : "bg-success"
                  }`}
                >
                  {caixa?.status}
                </span>
                <span className="text-muted small">
                  Resp: <strong>{caixa?.nome_responsavel || "N/A"}</strong>
                </span>
                {canManage && caixa?.status !== "FECHADO" && (
                  <button
                    className="btn btn-sm btn-link p-0 ms-1 text-secondary"
                    onClick={() => setIsChangingUser(!isChangingUser)}
                  >
                    <FontAwesomeIcon
                      icon={faUserExchange}
                      title="Trocar Responsável"
                    />
                  </button>
                )}
              </div>

              {/* Overlay de Busca de Responsável */}
              {isChangingUser && (
                <div
                  className="mt-2 bg-white p-2 rounded shadow position-absolute border"
                  style={{ zIndex: 100, width: "300px" }}
                >
                  <div className="input-group input-group-sm mb-2">
                    <span className="input-group-text bg-white">
                      <FontAwesomeIcon icon={faSearch} className="text-muted" />
                    </span>
                    <input
                      className="form-control"
                      placeholder="Buscar funcionário..."
                      onChange={(e) => searchUsers(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div
                    className="list-group"
                    style={{ maxHeight: "150px", overflowY: "auto" }}
                  >
                    {users.map((u) => (
                      <button
                        key={u.id_user_profile}
                        className="list-group-item list-group-item-action py-1 small border-0"
                        onClick={() =>
                          handleChangeResponsible(u.id_user_profile)
                        }
                      >
                        {u.nome}
                      </button>
                    ))}
                  </div>
                  <div className="text-end mt-2">
                    <button
                      className="btn btn-xs btn-light text-secondary"
                      onClick={() => setIsChangingUser(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4 pt-3">
            {successMsg && (
              <div className="alert alert-success py-2 small">{successMsg}</div>
            )}

            {/* 1. Componente de Estatísticas */}
            <CaixaStats caixa={caixa} stats={stats} />

            {/* 2. Componente de Controles de Status (Fechar/Reabrir) */}
            <CaixaStatusControls
              caixa={caixa}
              stats={stats}
              isClosing={isClosing}
              setIsClosing={setIsClosing}
              saldoFechamento={saldoFechamento}
              setSaldoFechamento={setSaldoFechamento}
              handleToggleStatus={handleToggleStatus}
            />

            {/* Título da Lista e Botão Adicionar */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-secondary m-0">
                Histórico de Movimentações
              </h6>
              {caixa?.status !== "FECHADO" && (
                <button
                  className={`btn btn-sm rounded-pill px-3 ${
                    isAddingMov ? "btn-light border" : "btn-dark"
                  }`}
                  onClick={() => setIsAddingMov(!isAddingMov)}
                >
                  <FontAwesomeIcon
                    icon={isAddingMov ? faTimes : faPlus}
                    className="me-1"
                  />
                  {isAddingMov ? "Cancelar" : "Lançar"}
                </button>
              )}
            </div>

            {/* 3. Formulário de Adição */}
            {isAddingMov && (
              <MovimentacaoForm
                newMovTipo={newMovTipo}
                setNewMovTipo={setNewMovTipo}
                newMovValor={newMovValor}
                setNewMovValor={setNewMovValor}
                newMovDesc={newMovDesc}
                setNewMovDesc={setNewMovDesc}
                onSave={handleAddMovimentacao}
              />
            )}

            {/* 4. Tabela de Movimentações */}
            <MovimentacoesTable
              movimentacoes={movimentacoes}
              canManage={canManage}
              caixaStatus={caixa?.status}
              onDelete={handleDeleteMov}
            />

            {/* Paginação */}
            {movTotalPages > 1 && (
              <div className="d-flex justify-content-center gap-2">
                <button
                  className="btn btn-sm btn-light border"
                  disabled={movPage <= 1}
                  onClick={() => loadMovimentacoes(movPage - 1)}
                >
                  {"<"}
                </button>
                <span className="small align-self-center text-muted">
                  Página {movPage} de {movTotalPages}
                </span>
                <button
                  className="btn btn-sm btn-light border"
                  disabled={movPage >= movTotalPages}
                  onClick={() => loadMovimentacoes(movPage + 1)}
                >
                  {">"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaixaDetailModal;
