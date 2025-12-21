"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faPen,
  faSave,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";
import api from "../../utils/api";
import { Variation, GetVariationsQueryParams } from "./types/index";
import { ApiErrorResponse, PaginatedResponse } from "../../types/api";

interface ProductVariationsProps {
  productId: string;
}

const ProductVariations = ({ productId }: ProductVariationsProps) => {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search & Pagination
  const [searchVarTerm, setSearchVarTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 5;
  const [totalPages, setTotalPages] = useState(1);

  // Edit / Create State
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [editVarNome, setEditVarNome] = useState("");
  const [editVarQtd, setEditVarQtd] = useState(0);
  const [editVarValor, setEditVarValor] = useState(0);

  const loadVariations = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const isSearch = searchVarTerm.length > 0;
      const endpoint = isSearch
        ? `/products/${productId}/variations/search`
        : `/products/${productId}/variations`;

      const params: GetVariationsQueryParams = {
        page,
        perPage: limit,
      };

      if (isSearch) {
        params.term = searchVarTerm;
      }

      const res = await api.get<PaginatedResponse<Variation>>(endpoint, {
        params,
      });

      setVariations(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setError("");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || "Erro ao carregar variações."
      );
    } finally {
      setLoading(false);
    }
  }, [productId, page, limit, searchVarTerm]);

  // Load on mount or when dependencies change
  useEffect(() => {
    loadVariations();
  }, [loadVariations]);

  // --- ACTIONS ---

  const startEditVariation = (v: Variation) => {
    setEditingVarId(v.id_variacao);
    setEditVarNome(v.nome);
    setEditVarQtd(v.quantidade);
    setEditVarValor(Number(v.valor));
  };

  const startAddVariation = () => {
    setEditingVarId("new");
    setEditVarNome("");
    setEditVarQtd(0);
    setEditVarValor(0);
  };

  const cancelEditVariation = () => {
    setEditingVarId(null);
  };

  const saveVariation = async () => {
    if (!editVarNome) return alert("Nome da variação é obrigatório");

    try {
      if (editingVarId === "new") {
        await api.post("/products/variations", {
          id_produto: productId,
          nome: editVarNome,
          quantidade: editVarQtd,
          valor: editVarValor,
        });
      } else {
        await api.patch(`/products/variations/${editingVarId}`, {
          nome: editVarNome,
          quantidade: editVarQtd,
          valor: editVarValor,
        });
      }
      setEditingVarId(null);
      loadVariations();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.message || "Erro ao salvar variação.");
    }
  };

  const deleteVariation = async (id: string) => {
    if (!confirm("Excluir esta variação?")) return;
    try {
      await api.delete(`/products/variations/${id}`);
      loadVariations();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.message || "Erro ao excluir variação.");
    }
  };

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold text-secondary m-0">Variações</h6>
        <button
          className="btn btn-sm btn-outline-dark rounded-pill"
          onClick={startAddVariation}
          disabled={!!editingVarId}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> Nova
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* BUSCA */}
      <div className="input-group mb-3">
        <span className="input-group-text bg-white border-end-0">
          <FontAwesomeIcon icon={faSearch} className="text-muted" />
        </span>
        <input
          type="text"
          className="form-control border-start-0"
          placeholder="Buscar variação..."
          value={searchVarTerm}
          onChange={(e) => {
            setPage(1);
            setSearchVarTerm(e.target.value);
          }}
        />
      </div>

      {/* TABELA */}
      <div className="table-responsive border rounded">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="small fw-bold ps-3">Variação</th>
              <th className="small fw-bold text-center">Estoque</th>
              <th className="small fw-bold text-end">Preço</th>
              <th className="small fw-bold text-center" style={{ width: 100 }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {/* LINHA DE EDIÇÃO / NOVA */}
            {editingVarId === "new" && (
              <tr className="bg-light table-active">
                <td className="ps-3">
                  <input
                    className="form-control form-control-sm"
                    autoFocus
                    placeholder="Ex: G, Vermelho"
                    value={editVarNome}
                    onChange={(e) => setEditVarNome(e.target.value)}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="number"
                    className="form-control form-control-sm text-center"
                    style={{ maxWidth: 80, margin: "0 auto" }}
                    value={editVarQtd}
                    onChange={(e) => setEditVarQtd(Number(e.target.value))}
                  />
                </td>
                <td className="text-end">
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm text-end"
                    style={{ maxWidth: 100, marginLeft: "auto" }}
                    value={editVarValor}
                    onChange={(e) => setEditVarValor(Number(e.target.value))}
                  />
                </td>
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-success me-1"
                    onClick={saveVariation}
                  >
                    <FontAwesomeIcon icon={faSave} />
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={cancelEditVariation}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </td>
              </tr>
            )}

            {/* LISTA DE VARIAÇÕES */}
            {loading && variations.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-3">
                  Carregando...
                </td>
              </tr>
            ) : (
              variations.map((v) =>
                editingVarId === v.id_variacao ? (
                  // MODO EDIÇÃO
                  <tr key={v.id_variacao} className="bg-light table-active">
                    <td className="ps-3">
                      <input
                        className="form-control form-control-sm"
                        value={editVarNome}
                        onChange={(e) => setEditVarNome(e.target.value)}
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="number"
                        className="form-control form-control-sm text-center"
                        style={{ maxWidth: 80 }}
                        value={editVarQtd}
                        onChange={(e) => setEditVarQtd(Number(e.target.value))}
                      />
                    </td>
                    <td className="text-end">
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm text-end"
                        style={{ maxWidth: 100 }}
                        value={editVarValor}
                        onChange={(e) =>
                          setEditVarValor(Number(e.target.value))
                        }
                      />
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm btn-success me-1"
                        onClick={saveVariation}
                      >
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={cancelEditVariation}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </td>
                  </tr>
                ) : (
                  // MODO VISUALIZAÇÃO
                  <tr key={v.id_variacao}>
                    <td className="ps-3 fw-medium">{v.nome}</td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          v.quantidade > 0
                            ? "bg-success-subtle text-success"
                            : "bg-danger-subtle text-danger"
                        }`}
                      >
                        {v.quantidade} un
                      </span>
                    </td>
                    <td className="text-end font-monospace">
                      R$ {Number(v.valor).toFixed(2)}
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-link text-secondary p-1 me-2"
                        onClick={() => startEditVariation(v)}
                        disabled={!!editingVarId}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="btn btn-link text-danger p-1"
                        onClick={() => deleteVariation(v.id_variacao)}
                        disabled={!!editingVarId}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                )
              )
            )}

            {!loading && variations.length === 0 && editingVarId !== "new" && (
              <tr>
                <td colSpan={4} className="text-center py-3 text-muted">
                  Nenhuma variação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}
      <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
        <button
          className="btn btn-sm btn-outline-secondary rounded-pill px-3"
          disabled={page <= 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Anterior
        </button>
        <span className="fw-bold small">
          Página {page} / {totalPages}
        </span>
        <button
          className="btn btn-sm btn-outline-secondary rounded-pill px-3"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

export default ProductVariations;
