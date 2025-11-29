"use client";
import { useState } from "react";
import { AxiosError } from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faTag,
  faBarcode,
  faLayerGroup,
  faVenusMars,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";
import { ApiErrorResponse } from "./types";

interface AddProductProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddProductModal = ({ onClose, onSuccess }: AddProductProps) => {
  const [nome, setNome] = useState("");
  const [referencia, setReferencia] = useState("");
  const [categoria, setCategoria] = useState("");
  const [material, setMaterial] = useState("");
  const [genero, setGenero] = useState("UNISSEX");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) throw new Error("Sessão inválida.");
      const currentUser = JSON.parse(storedUser);

      const payload = {
        id_loja: currentUser.lojaId, // Pega do usuário logado
        nome,
        referencia,
        categoria,
        material,
        genero,
      };

      await api.post("/products", payload);
      onSuccess();
    } catch (error) {
      console.error(error);
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as ApiErrorResponse;
        setError(errorData?.error || "Erro ao criar produto.");
      } else {
        setError("Erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.48)" }}
    >
      <div className="modal-dialog detail-box" style={{ maxWidth: "600px" }}>
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-white border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-secondary">Novo Produto</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4 pt-2">
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="row g-3">
              {/* NOME */}
              <div className="col-12">
                <label className="form-label small text-muted fw-bold">
                  Nome do Produto
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faBox}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    placeholder="Ex: Camiseta Básica"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* REFERÊNCIA */}
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  Referência (Cód.)
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faBarcode}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    placeholder="Ex: REF-001"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                  />
                </div>
              </div>

              {/* CATEGORIA */}
              <div className="col-md-6">
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
                    placeholder="Ex: Camisetas"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  />
                </div>
              </div>

              {/* MATERIAL */}
              <div className="col-md-6">
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
                    placeholder="Ex: Algodão"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                  />
                </div>
              </div>

              {/* GÊNERO */}
              <div className="col-md-6">
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

              <div className="col-12 mt-4 d-flex justify-content-end align-items-center border-top pt-3">
                <button
                  type="button"
                  className="btn btn-link text-secondary text-decoration-none me-3"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button-dark-grey px-5 py-2 rounded-pill"
                  disabled={loading}
                >
                  {loading ? "Criando..." : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
