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
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";
import Image from "next/image";
import api from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import {
  Variation,
  VariationImage,
  GetVariationsQueryParams,
} from "./types/index";
import { ApiErrorResponse, PaginatedResponse } from "../../types/api";

// --- SUB-COMPONENTE: Linha da Tabela (Carrossel de Imagens) ---
interface VariationRowProps {
  variation: Variation;
  onEdit: (v: Variation) => void;
  onDelete: (id: string) => void;
  onExpandImage: (url: string) => void;
  isEditingDisabled: boolean;
}

const VariationRow = ({
  variation,
  onEdit,
  onDelete,
  onExpandImage,
  isEditingDisabled,
}: VariationRowProps) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const images = variation.imagens || [];
  const hasMultipleImages = images.length > 1;

  const currentImageObj = images.length > 0 ? images[currentImgIndex] : null;
  const thumbUrl = getImageUrl(currentImageObj?.caminho);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <tr>
      <td className="text-center p-2">
        <div
          className="bg-white border rounded mx-auto d-flex align-items-center justify-content-center overflow-hidden position-relative shadow-sm group-hover-trigger"
          style={{
            width: 60,
            height: 60,
            cursor: thumbUrl ? "pointer" : "default",
          }}
          onClick={() => thumbUrl && onExpandImage(thumbUrl)}
          title={thumbUrl ? "Clique para ampliar" : "Sem imagem"}
        >
          {thumbUrl ? (
            <>
              <Image
                src={thumbUrl}
                alt="Var"
                fill
                sizes="60px"
                style={{ objectFit: "cover" }}
              />
              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="position-absolute start-0 top-50 translate-middle-y btn btn-sm btn-dark p-0 d-flex align-items-center justify-content-center opacity-50 hover-opacity-100"
                    style={{
                      width: 15,
                      height: 20,
                      borderRadius: "0 4px 4px 0",
                      zIndex: 5,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faChevronLeft}
                      style={{ fontSize: 8 }}
                    />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="position-absolute end-0 top-50 translate-middle-y btn btn-sm btn-dark p-0 d-flex align-items-center justify-content-center opacity-50 hover-opacity-100"
                    style={{
                      width: 15,
                      height: 20,
                      borderRadius: "4px 0 0 4px",
                      zIndex: 5,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      style={{ fontSize: 8 }}
                    />
                  </button>
                  <div
                    className="position-absolute bottom-0 w-100 text-center bg-dark bg-opacity-50 text-white"
                    style={{ fontSize: "8px", lineHeight: "10px" }}
                  >
                    {currentImgIndex + 1}/{images.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <FontAwesomeIcon icon={faImage} className="text-light fs-4" />
          )}
        </div>
      </td>
      <td className="ps-3">
        <div className="fw-bold text-dark">{variation.nome}</div>
        <div
          className="small text-muted text-truncate"
          style={{ maxWidth: 220 }}
        >
          {variation.descricao || "-"}
        </div>
      </td>
      <td className="text-center">
        <span
          className={`badge ${
            variation.quantidade > 0
              ? "bg-success-subtle text-success"
              : "bg-danger-subtle text-danger"
          }`}
        >
          {variation.quantidade} un
        </span>
      </td>
      <td className="text-end font-monospace fw-medium">
        R$ {Number(variation.valor).toFixed(2)}
      </td>
      <td className="text-center">
        <button
          className="btn btn-link text-primary p-1 me-2"
          onClick={() => onEdit(variation)}
          disabled={isEditingDisabled}
          title="Editar"
        >
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button
          className="btn btn-link text-danger p-1"
          onClick={() => onDelete(variation.id_variacao)}
          disabled={isEditingDisabled}
          title="Excluir"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </td>
    </tr>
  );
};

// --- COMPONENTE PRINCIPAL ---

interface ProductVariationsProps {
  productId: string;
}

const ProductVariations = ({ productId }: ProductVariationsProps) => {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchVarTerm, setSearchVarTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 5;
  const [totalPages, setTotalPages] = useState(1);

  const [editingVarId, setEditingVarId] = useState<string | null>(null);

  const [editVarNome, setEditVarNome] = useState("");
  const [editVarQtd, setEditVarQtd] = useState(0);
  const [editVarValor, setEditVarValor] = useState(0);
  const [editVarDescricao, setEditVarDescricao] = useState("");

  const [existingImages, setExistingImages] = useState<VariationImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const loadVariations = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const isSearch = searchVarTerm.length > 0;
      const endpoint = isSearch
        ? `/products/${productId}/variations/search`
        : `/products/${productId}/variations`;

      const params: GetVariationsQueryParams = { page, perPage: limit };
      if (isSearch) params.term = searchVarTerm;

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

  const resetForm = () => {
    setEditVarNome("");
    setEditVarQtd(0);
    setEditVarValor(0);
    setEditVarDescricao("");
    setExistingImages([]);
    setSelectedFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEditVariation = (v: Variation) => {
    setEditingVarId(v.id_variacao);
    setEditVarNome(v.nome || "");
    setEditVarQtd(v.quantidade || 0);
    setEditVarValor(Number(v.valor));
    setEditVarDescricao(v.descricao || "");
    setExistingImages(v.imagens || []);
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

  const removeExistingImage = (idImagem: string) => {
    setExistingImages((prev) =>
      prev.filter((img) => img.id_imagem !== idImagem),
    );
  };

  const saveVariation = async () => {
    if (!editVarNome) return alert("Nome da variação é obrigatório");

    // --- VALIDAÇÃO DE LIMITE DE IMAGENS ---
    const totalImages = existingImages.length + (selectedFiles?.length || 0);
    if (totalImages > 5) {
      return alert(
        `Limite excedido! Você tem ${totalImages} imagens selecionadas. O máximo é 5.`,
      );
    }

    try {
      const formData = new FormData();
      formData.append("nome", editVarNome);
      formData.append("quantidade", String(editVarQtd));
      formData.append("valor", String(editVarValor));
      if (editVarDescricao) formData.append("descricao", editVarDescricao);

      existingImages.forEach((img) => {
        formData.append("kept_images", img.id_imagem);
      });

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
    if (!confirm("Excluir esta variação permanentemente?")) return;
    try {
      await api.delete(`/products/variations/${id}`);
      loadVariations();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.message || "Erro ao excluir variação.");
    }
  };

  return (
    <div className="mt-4 position-relative">
      {/* --- LIGHTBOX --- */}
      {expandedImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(5px)",
          }}
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="position-relative"
            style={{ maxWidth: "90%", maxHeight: "90%" }}
          >
            <button
              className="btn btn-dark position-absolute top-0 end-0 m-3 rounded-circle shadow"
              onClick={() => setExpandedImage(null)}
              style={{ zIndex: 10, width: 40, height: 40 }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedImage}
              alt="Full"
              className="img-fluid rounded shadow-lg"
              style={{ maxHeight: "85vh", objectFit: "contain" }}
            />
          </div>
        </div>
      )}

      {/* --- CABEÇALHO --- */}
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
          placeholder="Buscar variação..."
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
              <th className="small fw-bold text-center" style={{ width: 180 }}>
                Imagens
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
            {/* --- MODO EDIÇÃO --- */}
            {editingVarId && (
              <tr className="bg-light table-active border border-primary">
                <td className="align-top pt-3 p-2">
                  <div className="d-flex flex-column gap-2">
                    {/* Lista de Imagens Existentes */}
                    {existingImages.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mb-1">
                        {existingImages.map((img) => (
                          <div
                            key={img.id_imagem}
                            className="position-relative border rounded overflow-hidden bg-white shadow-sm"
                            style={{ width: 48, height: 48 }}
                          >
                            <Image
                              src={getImageUrl(img.caminho) || ""}
                              alt="Thumb"
                              fill
                              sizes="48px"
                              style={{ objectFit: "cover" }}
                            />
                            <button
                              onClick={() => removeExistingImage(img.id_imagem)}
                              className="position-absolute top-0 end-0 btn btn-danger p-0 d-flex justify-content-center align-items-center"
                              style={{
                                width: 16,
                                height: 16,
                                fontSize: 10,
                                borderRadius: "0 0 0 4px",
                              }}
                              title="Remover"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botão de Upload */}
                    <div>
                      <button
                        className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ fontSize: "0.75rem" }}
                      >
                        <FontAwesomeIcon icon={faUpload} />
                        {editingVarId === "new"
                          ? "Carregar Fotos"
                          : "Adicionar Novas"}
                      </button>
                      <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="d-none"
                        accept="image/*"
                        onChange={(e) => setSelectedFiles(e.target.files)}
                      />
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        {selectedFiles && selectedFiles.length > 0 ? (
                          <span
                            className="text-success fw-bold"
                            style={{ fontSize: "0.65rem" }}
                          >
                            +{selectedFiles.length} selecionado(s)
                          </span>
                        ) : (
                          <span></span>
                        )}
                        {/* AVISO DE LIMITE */}
                        <span
                          className="text-muted"
                          style={{ fontSize: "0.65rem" }}
                        >
                          (Máx. 5)
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="ps-3 align-top pt-3">
                  <div className="d-flex flex-column gap-2">
                    <input
                      className="form-control form-control-sm"
                      autoFocus
                      placeholder="Nome"
                      value={editVarNome}
                      onChange={(e) => setEditVarNome(e.target.value)}
                    />
                    <textarea
                      className="form-control form-control-sm"
                      placeholder="Descrição"
                      rows={2}
                      value={editVarDescricao}
                      onChange={(e) => setEditVarDescricao(e.target.value)}
                      style={{ resize: "none" }}
                    />
                  </div>
                </td>

                {/* --- CAMPO DE ESTOQUE (INTEIRO) --- */}
                <td className="text-center align-top pt-3">
                  <input
                    type="number"
                    step="1" // HTML hint para incrementos inteiros
                    min="0"
                    className="form-control form-control-sm text-center"
                    style={{ maxWidth: 80, margin: "0 auto" }}
                    value={editVarQtd}
                    onKeyDown={(e) => {
                      // Bloqueia ponto e vírgula
                      if (e.key === "." || e.key === ",") e.preventDefault();
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Permite apagar tudo (ficar vazio), senão arredonda para baixo
                      if (val === "") setEditVarQtd(0);
                      else setEditVarQtd(Math.floor(Math.max(0, Number(val))));
                    }}
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

            {/* --- LISTAGEM --- */}
            {variations.map((v) => {
              if (editingVarId === v.id_variacao) return null;
              return (
                <VariationRow
                  key={v.id_variacao}
                  variation={v}
                  onEdit={startEditVariation}
                  onDelete={deleteVariation}
                  onExpandImage={setExpandedImage}
                  isEditingDisabled={!!editingVarId}
                />
              );
            })}

            {!loading && variations.length === 0 && editingVarId !== "new" && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted">
                  Nenhuma variação encontrada.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-4">
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
        <span className="fw-bold small text-muted">
          Página {page} de {totalPages}
        </span>
        <button
          className="btn btn-sm btn-outline-secondary rounded-pill px-3"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Próxima
        </button>
      </div>

      <style jsx global>{`
        .hover-opacity-100:hover {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default ProductVariations;
