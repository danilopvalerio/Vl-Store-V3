// src/features/products/ProductForm.tsx
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
} from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";
import api from "../../utils/api";
import { Product, UpdateProductPayload } from "./types/index";
import { ApiErrorResponse } from "../../types/api";

interface ProductFormProps {
  product: Product;
  onSuccess: () => void;
  onClose: () => void;
}

const ProductForm = ({ product, onSuccess, onClose }: ProductFormProps) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Form States initialized with props
  const [nome, setNome] = useState(product.nome);
  const [referencia, setReferencia] = useState(product.referencia || "");
  const [categoria, setCategoria] = useState(product.categoria || "");
  const [material, setMaterial] = useState(product.material || "");
  const [genero, setGenero] = useState<string>(product.genero || "UNISSEX");
  const [ativo, setAtivo] = useState(product.ativo || false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      setIsAdmin(
        currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN",
      );
    }
  }, []);

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

      await api.patch(`/products/${product.id_produto}`, payload);

      setSuccessMsg("Produto atualizado!");
      setTimeout(() => setSuccessMsg(""), 3000);
      onSuccess();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || "Erro ao atualizar produto.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm("Tem certeza? Isso excluirá o produto e TODAS as variações."))
      return;

    try {
      setSaving(true);
      await api.delete(`/products/${product.id_produto}`);
      onSuccess();
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message || "Erro ao excluir produto.",
      );
      setSaving(false);
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <form onSubmit={handleUpdateProduct} className="row g-3">
        <div className="col-12 col-md-8">
          <label className="form-label small text-muted fw-bold">Nome</label>
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

        {/* ROW 2: Category, Material, Gender */}
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
          <label className="form-label small text-muted fw-bold">Gênero</label>
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
              <option value="INFANTIL">Infantil (Geral)</option>
              <option value="INFANTIL_FEMININO">Infantil Feminino</option>
              <option value="INFANTIL_MASCULINO">Infantil Masculino</option>
            </select>
          </div>
        </div>

        {/* ACTIONS ROW */}
        <div className="col-12 d-flex gap-2 mt-4">
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

        <div className="col-12 mt-2">
          <button
            type="submit"
            className="button-dark-grey w-100 px-3 py-2 rounded-pill"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar Dados"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
