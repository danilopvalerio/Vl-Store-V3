"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faBarcode,
  faTag,
  faLayerGroup,
  faVenusMars,
  faTrash,
  faPlus,
  faPen,
  faSave,
  faTimes,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import axios, { AxiosError } from "axios";
import api from "../../utils/api";
import {
  Product,
  Variation,
  UpdateProductPayload,
  GetVariationsQueryParams,
  PaginatedResponse,
} from "./types";
import { ApiErrorDTO } from "@/app/types/ApiTypes";

interface Props {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductDetailModal = ({ productId, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Dados do Produto (Pai)
  const [nome, setNome] = useState("");
  const [referencia, setReferencia] = useState("");
  const [categoria, setCategoria] = useState("");
  const [material, setMaterial] = useState("");
  const [genero, setGenero] = useState("");
  const [ativo, setAtivo] = useState(true);

  // --- VARIAÇÕES (PAGINADAS) ---
  const [variations, setVariations] = useState<Variation[]>([]);
  const [searchVarTerm, setSearchVarTerm] = useState("");

  const [page, setPage] = useState(1);
  const limit = 5; // Equivalente ao perPage do backend
  const [totalPages, setTotalPages] = useState(1);

  // --- EDIÇÃO / CRIAÇÃO ---
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [editVarNome, setEditVarNome] = useState("");
  const [editVarQtd, setEditVarQtd] = useState(0);
  const [editVarValor, setEditVarValor] = useState(0);

  const [isAdmin, setIsAdmin] = useState(false);

  // =========================================================
  // 🔹 CARREGAR O PRODUTO (SEM VARIAÇÕES)
  // =========================================================
  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get<Product>(`/products/${productId}`);
      const p = res.data;

      setNome(p.nome);
      setReferencia(p.referencia || "");
      setCategoria(p.categoria || "");
      setMaterial(p.material || "");
      setGenero(p.genero || "UNISSEX");
      setAtivo(p.ativo);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorDTO>;
      setError(axiosError.response?.data?.error || "Erro ao carregar produto.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // 🔹 CARREGAR VARIAÇÕES (CORRIGIDO PARA NOVAS ROTAS)
  // =========================================================
  const loadVariations = async () => {
    try {
      const isSearch = searchVarTerm.length > 0;

      const endpoint = isSearch
        ? `/products/${productId}/variations/search`
        : `/products/${productId}/variations`;

      // 1. Substituindo 'any' pelo DTO correto
      const params: GetVariationsQueryParams = {
        page,
        perPage: limit,
      };

      // Adiciona o termo apenas se for busca
      if (isSearch) {
        params.term = searchVarTerm;
      }

      // 2. Tipando o retorno do Axios com o Generico <PaginatedResponse<Variation>>
      // Isso garante que res.data tenha .data (array), .totalPages, etc.
      const res = await api.get<PaginatedResponse<Variation>>(endpoint, {
        params,
      });

      setVariations(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorDTO>;
      setError(
        axiosError.response?.data?.error ||
          "Erro ao carregar variações paginadas."
      );
    }
  };

  // -------- EXECUTA SEMPRE QUE PAGE OU SEARCH MUDAR ----
  useEffect(() => {
    if (productId) {
      loadProduct();
      loadVariations();
    }
  }, [productId]);

  useEffect(() => {
    loadVariations();
  }, [page, searchVarTerm]);

  // =========================================================
  // ADMIN
  // =========================================================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      setIsAdmin(
        currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN"
      );
    }
  }, []);
  // =========================================================
  // 🔹 Para fechar quando teclar esc
  // =========================================================
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // =========================================================
  // 🔹 UPDATE DO PRODUTO
  // =========================================================
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload: UpdateProductPayload = {
        nome,
        referencia,
        categoria,
        material,
        genero,
        ativo,
      };

      await api.patch(`/products/${productId}`, payload);

      setSuccessMsg("Produto atualizado!");
      setTimeout(() => setSuccessMsg(""), 3000);
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorDTO>;
        setError(
          axiosError.response?.data?.error || "Erro ao atualizar produto."
        );
      } else {
        setError("Erro inesperado ao atualizar.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // 🔹 DELETE DO PRODUTO
  // ============================================
  const handleDeleteProduct = async () => {
    if (!confirm("Tem certeza? Isso excluirá o produto e TODAS as variações."))
      return;

    try {
      setSaving(true);
      await api.delete(`/products/${productId}`);
      onSuccess();
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorDTO>;
      setError(axiosError.response?.data?.error || "Erro ao excluir produto.");
    } finally {
      setSaving(false);
    }
  };

  // ===============================================================
  // 🔹 EDIÇÃO / CRIAÇÃO DE VARIAÇÃO
  // ===============================================================
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
      // ⚠️ IMPORTANTE: As rotas de criação/edição continuam as mesmas
      // pois não dependem de aninhamento para funcionar, apenas o ID do produto no body

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
      loadVariations(); // Recarrega a lista
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorDTO>;
      setError(axiosError.response?.data?.error || "Erro ao salvar variação.");
    }
  };

  const deleteVariation = async (id: string) => {
    if (!confirm("Excluir esta variação?")) return;

    try {
      await api.delete(`/products/variations/${id}`);
      loadVariations();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorDTO>;
      setError(axiosError.response?.data?.error || "Erro ao excluir variação.");
    }
  };

  // ===========================================================
  // 🔹 RENDER
  // ===========================================================

  if (loading)
    return (
      <div className="modal-backdrop show d-flex justify-content-center align-items-center bg-dark bg-opacity-50">
        <div className="spinner-border text-white"></div>
      </div>
    );

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog detail-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content w-100 border-0 shadow">
          {/* HEADER */}
          <div className="modal-header w-100 bg-white border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center sticky-top">
            <h5 className="modal-title fw-bold text-secondary">
              Detalhes do Produto
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body w-100 p-4 pt-2">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && (
              <div className="alert alert-success">{successMsg}</div>
            )}

            {/* FORM PRODUTO */}
            <form onSubmit={handleUpdateProduct} className="row g-3 pb-5">
              <div className="col-12 col-md-8">
                <label className="form-label small text-muted fw-bold">
                  Nome
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faBox}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label small text-muted fw-bold">
                  Referência
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faBarcode}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted fw-bold">
                  Categoria
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faTag}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted fw-bold">
                  Material
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted fw-bold">
                  Gênero
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faVenusMars}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <select
                    className="p-2 ps-5 w-100 form-control-underline"
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                  >
                    <option value="UNISSEX">Unissex</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                    <option value="INFANTIL_FEMININO">Infantil Feminino</option>
                    <option value="INFANTIL_MASCULINO">
                      Infantil Masculino
                    </option>
                  </select>
                </div>
              </div>

              <div className="col-12 d-flex gap-2">
                <button
                  type="button"
                  className="button-white-grey-border col-6 px-3 py-2 rounded-pill"
                  onClick={handleDeleteProduct}
                  disabled={!isAdmin || saving}
                >
                  <FontAwesomeIcon icon={faTrash} className="me-2" /> Excluir
                </button>

                <div className="form-check form-switch d-flex justify-content-center align-items-center button-white-grey-border px-4 py-2 rounded-pill col-6">
                  <input
                    className="form-check-input me-2 ms-0 mt-0"
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                  />
                  <label className="form-check-label fw-bold small">
                    {ativo ? "ATIVO" : "INATIVO"}
                  </label>
                </div>
              </div>

              <div className="col-12 mt-3">
                <button
                  type="submit"
                  className="button-dark-grey w-100 px-3 py-2 rounded-pill"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar Dados"}
                </button>
              </div>
            </form>

            <hr className="my-4 text-muted" />

            {/* SEÇÃO VARIAÇÕES */}
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
                    <th
                      className="small fw-bold text-center"
                      style={{ width: 100 }}
                    >
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* NOVA VARIAÇÃO */}
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
                          onChange={(e) =>
                            setEditVarQtd(Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="text-end">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end"
                          style={{ maxWidth: 100, marginLeft: "auto" }}
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
                  )}

                  {/* LISTA */}
                  {variations.map((v) =>
                    editingVarId === v.id_variacao ? (
                      // EDITAR
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
                            onChange={(e) =>
                              setEditVarQtd(Number(e.target.value))
                            }
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
                      // VISUALIZAR
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
                  )}

                  {variations.length === 0 && editingVarId !== "new" && (
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
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
