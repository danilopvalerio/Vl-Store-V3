// src/features/products/ProductVariations.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faPen,
  faSave,
  faTimes,
  faTrash,
  faImage,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";
import Image from "next/image"; // <--- IMPORTANTE
import api from "../../utils/api";
import { Variation, GetVariationsQueryParams } from "./types/index";
import { ApiErrorResponse, PaginatedResponse } from "../../types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

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

  // Form Fields
  const [editVarNome, setEditVarNome] = useState("");
  const [editVarQtd, setEditVarQtd] = useState(0);
  const [editVarValor, setEditVarValor] = useState(0);
  const [editVarDescricao, setEditVarDescricao] = useState("");

  // Upload Files State
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        axiosError.response?.data?.message || "Erro ao carregar variações.",
      );
    } finally {
      setLoading(false);
    }
  }, [productId, page, limit, searchVarTerm]);

  useEffect(() => {
    loadVariations();
  }, [loadVariations]);

  // --- ACTIONS ---

  const resetForm = () => {
    setEditVarNome("");
    setEditVarQtd(0);
    setEditVarValor(0);
    setEditVarDescricao("");
    setSelectedFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEditVariation = (v: Variation) => {
    setEditingVarId(v.id_variacao);
    setEditVarNome(v.nome);
    setEditVarQtd(v.quantidade);
    setEditVarValor(Number(v.valor));
    setEditVarDescricao(v.descricao || "");
    setSelectedFiles(null);
  };

  const startAddVariation = () => {
    setEditingVarId("new");
    resetForm();
  };

  const cancelEditVariation = () => {
    setEditingVarId(null);
    resetForm();
  };

  const saveVariation = async () => {
    if (!editVarNome) return alert("Nome da variação é obrigatório");

    try {
      const formData = new FormData();
      formData.append("nome", editVarNome);
      formData.append("quantidade", String(editVarQtd));
      formData.append("valor", String(editVarValor));
      if (editVarDescricao) formData.append("descricao", editVarDescricao);

      if (selectedFiles && selectedFiles.length > 0) {
        Array.from(selectedFiles).forEach((file) => {
          formData.append("imagens", file);
        });
      }

      if (editingVarId === "new") {
        formData.append("id_produto", productId);
        await api.post("/products/variations", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (editingVarId) {
        await api.patch(`/products/variations/${editingVarId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setEditingVarId(null);
      resetForm();
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
        <h6 className="fw-bold text-secondary m-0">Variações do Produto</h6>
        <button
          className="btn btn-sm btn-outline-dark rounded-pill"
          onClick={startAddVariation}
          disabled={!!editingVarId}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> Nova Variação
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="input-group mb-3">
        <span className="input-group-text bg-white border-end-0">
          <FontAwesomeIcon icon={faSearch} className="text-muted" />
        </span>
        <input
          type="text"
          className="form-control border-start-0"
          placeholder="Buscar variação (nome, cor, tamanho)..."
          value={searchVarTerm}
          onChange={(e) => {
            setPage(1);
            setSearchVarTerm(e.target.value);
          }}
        />
      </div>

      <div className="table-responsive border rounded">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="small fw-bold text-center" style={{ width: 60 }}>
                Imagem
              </th>
              <th className="small fw-bold ps-3">Detalhes</th>
              <th className="small fw-bold text-center">Estoque</th>
              <th className="small fw-bold text-end">Preço (R$)</th>
              <th className="small fw-bold text-center" style={{ width: 100 }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {editingVarId && (
              <tr className="bg-light table-active border border-primary">
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-outline-secondary border-0"
                    onClick={() => fileInputRef.current?.click()}
                    title="Adicionar imagens"
                  >
                    <FontAwesomeIcon icon={faUpload} />
                  </button>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="d-none"
                    accept="image/*"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                  />
                  {selectedFiles && selectedFiles.length > 0 && (
                    <div
                      className="small text-success mt-1"
                      style={{ fontSize: "0.65rem" }}
                    >
                      {selectedFiles.length} file(s)
                    </div>
                  )}
                </td>
                <td className="ps-3">
                  <div className="d-flex flex-column gap-2">
                    <input
                      className="form-control form-control-sm"
                      autoFocus
                      placeholder="Nome (Ex: G, Azul)"
                      value={editVarNome}
                      onChange={(e) => setEditVarNome(e.target.value)}
                    />
                    <input
                      className="form-control form-control-sm"
                      placeholder="Descrição (opcional)"
                      value={editVarDescricao}
                      onChange={(e) => setEditVarDescricao(e.target.value)}
                    />
                  </div>
                </td>
                <td className="text-center align-top pt-3">
                  <input
                    type="number"
                    className="form-control form-control-sm text-center"
                    style={{ maxWidth: 80, margin: "0 auto" }}
                    value={editVarQtd}
                    onChange={(e) => setEditVarQtd(Number(e.target.value))}
                  />
                </td>
                <td className="text-end align-top pt-3">
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm text-end"
                    style={{ maxWidth: 100, marginLeft: "auto" }}
                    value={editVarValor}
                    onChange={(e) => setEditVarValor(Number(e.target.value))}
                  />
                </td>
                <td className="text-center align-top pt-3">
                  <div className="d-flex justify-content-center gap-1">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={saveVariation}
                      title="Salvar"
                    >
                      <FontAwesomeIcon icon={faSave} />
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={cancelEditVariation}
                      title="Cancelar"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {variations.map((v) => {
              if (editingVarId === v.id_variacao) return null;

              const mainImage =
                v.imagens?.find((img) => img.principal) || v.imagens?.[0];
              const thumbUrl = mainImage
                ? `${API_BASE_URL}${mainImage.caminho}`
                : null;

              return (
                <tr key={v.id_variacao}>
                  <td className="text-center p-1">
                    <div
                      className="bg-white border rounded mx-auto d-flex align-items-center justify-content-center overflow-hidden position-relative"
                      style={{ width: 40, height: 40 }} // position: relative é necessário no pai
                    >
                      {thumbUrl ? (
                        <Image
                          src={thumbUrl}
                          alt={v.nome}
                          fill
                          sizes="40px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faImage}
                          className="text-light"
                        />
                      )}
                    </div>
                  </td>
                  <td className="ps-3">
                    <div className="fw-medium">{v.nome}</div>
                    {v.descricao && (
                      <div
                        className="small text-muted text-truncate"
                        style={{ maxWidth: 200 }}
                      >
                        {v.descricao}
                      </div>
                    )}
                  </td>
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
                    {/* R$ RECOLOCADO AQUI */}
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
              );
            })}

            {!loading && variations.length === 0 && editingVarId !== "new" && (
              <tr>
                <td colSpan={5} className="text-center py-3 text-muted">
                  Nenhuma variação encontrada.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-secondary" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
