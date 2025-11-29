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
import { Product, Variation, UpdateProductPayload } from "./types";
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
  const [product, setProduct] = useState<Product | null>(null);
  const [nome, setNome] = useState("");
  const [referencia, setReferencia] = useState("");
  const [categoria, setCategoria] = useState("");
  const [material, setMaterial] = useState("");
  const [genero, setGenero] = useState("");
  const [ativo, setAtivo] = useState(true);

  // Dados das Variações (Filhos)
  const [variations, setVariations] = useState<Variation[]>([]);
  const [searchVarTerm, setSearchVarTerm] = useState("");

  // Estado para Edição/Criação de Variação (Inline)
  const [editingVarId, setEditingVarId] = useState<string | null>(null);
  const [editVarNome, setEditVarNome] = useState("");
  const [editVarQtd, setEditVarQtd] = useState(0);
  const [editVarValor, setEditVarValor] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- CARREGAMENTO ---
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get<Product>(`/products/${productId}`);
      const p = res.data;

      setProduct(p);
      setNome(p.nome);
      setReferencia(p.referencia || "");
      setCategoria(p.categoria || "");
      setMaterial(p.material || "");
      setGenero(p.genero || "UNISSEX");
      setAtivo(p.ativo);
      setVariations(p.produto_variacao || []);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorDTO>;
      setError(axiosError.response?.data?.error || "Erro ao carregar produto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      setIsAdmin(
        currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN"
      );
    }
  }, []);

  useEffect(() => {
    if (productId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // --- PRODUTO PAI: UPDATE & DELETE ---

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
      // Sem console.error aqui. Apenas tratativa visual.
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

  const handleDeleteProduct = async () => {
    if (!confirm("Tem certeza? Isso excluirá o produto e TODAS as variações."))
      return;
    try {
      setSaving(true);
      await api.delete(`/products/${productId}`);
      onSuccess();
      onClose();
    } catch (err) {
      // Sem console.error
      const axiosError = err as AxiosError<ApiErrorDTO>;
      setError(axiosError.response?.data?.error || "Erro ao excluir produto.");
      setSaving(false);
    }
  };

  // --- VARIAÇÕES: CREATE / UPDATE / DELETE ---

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
      await loadData();
      setEditingVarId(null);
      setSuccessMsg(
        editingVarId === "new" ? "Variação criada!" : "Variação atualizada!"
      );
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      // Sem console.error
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorDTO>;
        setError(
          axiosError.response?.data?.error || "Erro ao salvar variação."
        );
      } else {
        alert("Erro ao salvar variação.");
      }
    }
  };

  const deleteVariation = async (id: string) => {
    if (!confirm("Excluir esta variação?")) return;
    try {
      await api.delete(`/products/variations/${id}`);
      await loadData();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorDTO>;
      setError(axiosError.response?.data?.error || "Erro ao excluir variação.");
    }
  };

  // --- RENDERIZAÇÃO ---

  if (loading)
    return (
      <div className="modal-backdrop show d-flex justify-content-center align-items-center bg-dark bg-opacity-50">
        <div className="spinner-border text-white"></div>
      </div>
    );

  const filteredVars = variations.filter((v) =>
    v.nome.toLowerCase().includes(searchVarTerm.toLowerCase())
  );

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="modal-dialog detail-box w-100"
        style={{ maxWidth: "800px" }}
      >
        <div
          className="modal-content border-0 shadow"
          style={{ maxHeight: "90vh", overflowY: "auto" }}
        >
          {/* Header */}
          <div className="modal-header border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center bg-white sticky-top">
            <h5 className="modal-title fw-bold text-secondary">
              Detalhes do Produto
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4 pt-2">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && (
              <div className="alert alert-success">{successMsg}</div>
            )}

            {/* --- FORMULÁRIO PRODUTO PAI --- */}
            <form onSubmit={handleUpdateProduct} className="row g-3 mb-5">
              <div className="col-12 d-flex justify-content-between align-items-center">
                <span className="badge bg-light text-dark border">
                  {product?.id_produto}
                </span>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                  />
                  <label className="form-check-label fw-bold small">
                    {ativo ? "ATIVO" : "INATIVO"}
                  </label>
                </div>
              </div>

              {/* Campos do Produto */}
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
                    <option value="INFANTIL">Infantil</option>
                  </select>
                </div>
              </div>

              <div className="col-12 d-flex justify-content-between mt-3">
                <button
                  type="button"
                  className="btn btn-link text-danger p-0"
                  onClick={handleDeleteProduct}
                  disabled={!isAdmin || saving}
                >
                  <FontAwesomeIcon icon={faTrash} className="me-2" /> Excluir
                  Produto
                </button>
                <button
                  type="submit"
                  className="button-dark-grey px-4 py-2 rounded-pill"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar Dados Gerais"}
                </button>
              </div>
            </form>

            <hr className="my-4 text-muted" />

            {/* --- SEÇÃO DE VARIAÇÕES --- */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-secondary m-0">
                Variações de Estoque
              </h6>
              <button
                className="btn btn-sm btn-outline-dark rounded-pill"
                onClick={startAddVariation}
                disabled={!!editingVarId}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" /> Nova Variação
              </button>
            </div>

            {/* Busca de Variação (útil se tiver muitas) */}
            <div className="input-group mb-3">
              <span className="input-group-text bg-white border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar variação (ex: Azul, G...)"
                value={searchVarTerm}
                onChange={(e) => setSearchVarTerm(e.target.value)}
              />
            </div>

            <div className="table-responsive border rounded">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="small fw-bold ps-3">
                      Variação / Nome
                    </th>
                    <th scope="col" className="small fw-bold text-center">
                      Estoque
                    </th>
                    <th scope="col" className="small fw-bold text-end">
                      Preço (R$)
                    </th>
                    <th
                      scope="col"
                      className="small fw-bold text-center"
                      style={{ width: "100px" }}
                    >
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* LINHA DE CRIAÇÃO (SÓ APARECE SE TIVER ADICIONANDO) */}
                  {editingVarId === "new" && (
                    <tr className="bg-light table-active border-2 border-primary">
                      <td className="ps-3">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Ex: G, Vermelho"
                          autoFocus
                          value={editVarNome}
                          onChange={(e) => setEditVarNome(e.target.value)}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="number"
                          className="form-control form-control-sm text-center"
                          style={{ maxWidth: "80px", margin: "0 auto" }}
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
                          style={{ maxWidth: "100px", marginLeft: "auto" }}
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

                  {/* LISTA DE VARIAÇÕES */}
                  {filteredVars.map((v) => (
                    <tr key={v.id_variacao}>
                      {editingVarId === v.id_variacao ? (
                        // MODO EDIÇÃO
                        <>
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
                              style={{ maxWidth: "80px", margin: "0 auto" }}
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
                              style={{ maxWidth: "100px", marginLeft: "auto" }}
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
                        </>
                      ) : (
                        // MODO VISUALIZAÇÃO
                        <>
                          <td className="ps-3 fw-medium text-dark">{v.nome}</td>
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
                        </>
                      )}
                    </tr>
                  ))}
                  {filteredVars.length === 0 && editingVarId !== "new" && (
                    <tr>
                      <td colSpan={4} className="text-center py-3 text-muted">
                        Nenhuma variação encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
