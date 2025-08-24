// products/AddProductModal.tsx
"use client";

import { useState } from "react";
import api from "../../utils/api"; // Make sure this path is correct
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";

// --- Interfaces ---
interface Variation {
  descricao: string;
  quantidade: number;
  valor: number | string;
}

interface Product {
  referencia: string;
  nome: string;
  categoria: string;
  material: string;
  genero: string;
  idLoja: string;
}

// ✨ Props para o novo componente de Adicionar Produto
interface AddProductProps {
  onClose: () => void;
  onSaveSuccess: () => void; // Renomeado de onProductUpdate para maior clareza
}

// Initial state for the form
const initialProductState: Product = {
  referencia: "",
  nome: "",
  categoria: "",
  material: "",
  genero: "",
  idLoja: "1", // ⚠️ ATTENTION: Set a default or get this dynamically
};

const AddProductModal: React.FC<AddProductProps> = ({
  onClose,
  onSaveSuccess,
}) => {
  const [productData, setProductData] = useState<Product>(initialProductState);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProductData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleVariationChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const updatedVariations = [...variations];
    updatedVariations[index] = { ...updatedVariations[index], [name]: value };
    setVariations(updatedVariations);
  };

  const addVariation = () => {
    setVariations([...variations, { descricao: "", quantidade: 0, valor: "" }]);
  };

  const removeVariation = (indexToRemove: number) => {
    setVariations(variations.filter((_, index) => index !== indexToRemove));
  };

  const showMessage = (setter: Function, message: string) => {
    setter(message);
    setTimeout(() => setter(""), 4000);
  };

  const handleSave = async () => {
    if (!productData.referencia || !productData.nome) {
      showMessage(setError, "Preencha pelo menos Referência e Nome.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Step 1: Create the main product
      await api.post("/produtos", productData);

      // Step 2: Create variations if they exist
      if (variations.length > 0) {
        const variationPromises = variations.map((variation) =>
          api.post("/variacoes", {
            ...variation,
            valor: parseFloat(String(variation.valor).replace(",", ".")) || 0,
            referenciaProduto: productData.referencia,
          })
        );
        await Promise.all(variationPromises);
      }

      showMessage(setSuccess, "Produto cadastrado com sucesso!");

      // ✨ Notifica o pai e fecha o componente/modal
      onSaveSuccess();
      setTimeout(onClose, 1200); // Dá tempo para o usuário ver a msg de sucesso
    } catch (err: any) {
      console.error("Erro ao salvar produto:", err);
      const errorMessage =
        err.response?.data?.message || "Ocorreu um erro ao salvar.";
      showMessage(setError, errorMessage);
      setIsSubmitting(false); // Libera o botão em caso de erro
    }
  };

  const isSaveDisabled =
    !productData.referencia || !productData.nome || isSubmitting;

  return (
    <div className="modal-content rounded-4">
      <header className="w-100 terciary p-3 d-flex justify-content-between align-items-center">
        <h4 className="m-0 w-100 text-center primary-color">
          Adicionar Novo Produto
        </h4>
        {/* O botão de fechar no header agora usa a prop onClose */}
        <button
          className="btn"
          onClick={onClose}
          aria-label="Fechar"
          disabled={isSubmitting}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </header>

      <div className="modal-scroll terciary p-4">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Campos do produto (referencia, nome, etc.) - Sem alterações */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label htmlFor="referencia" className="form-label ps-2">
                Referência (SKU)
              </label>
              <input
                id="referencia"
                name="referencia"
                className="w-100 p-2 border-input"
                placeholder="Ex: SKU-MODA-007"
                value={productData.referencia}
                onChange={handleProductChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="nome" className="form-label ps-2">
                Nome do Produto
              </label>
              <input
                id="nome"
                name="nome"
                className="w-100 p-2 border-input"
                placeholder="Ex: Camiseta Polo Levi's"
                value={productData.nome}
                onChange={handleProductChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="categoria" className="form-label ps-2">
                Categoria
              </label>
              <input
                id="categoria"
                name="categoria"
                className="w-100 p-2 border-input"
                placeholder="Ex: Roupas"
                value={productData.categoria}
                onChange={handleProductChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="material" className="form-label ps-2">
                Material
              </label>
              <input
                id="material"
                name="material"
                className="w-100 p-2 border-input"
                placeholder="Ex: Algodão"
                value={productData.material}
                onChange={handleProductChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="genero" className="form-label ps-2">
                Gênero
              </label>
              <select
                id="genero"
                name="genero"
                className="w-100 ps-2 rounded-5 border-input"
                style={{ height: "40px" }}
                value={productData.genero}
                onChange={handleProductChange}
                required
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Unissex">Unissex</option>
              </select>
            </div>
          </div>

          {/* Seção de Variações - Sem alterações */}
          <h5 className="mb-3">Variações (Opcional)</h5>
          <div className="variations-container">
            {variations.map((v, i) => (
              <div
                key={`new-${i}`}
                className="row g-2 align-items-center mb-2 p-2 rounded"
              >
                <div className="col-sm-5">
                  <input
                    type="text"
                    name="descricao"
                    className="w-100 p-2 border-input"
                    placeholder="Descrição (Ex: GG, Azul)"
                    value={v.descricao}
                    onChange={(e) => handleVariationChange(i, e)}
                  />
                </div>
                <div className="col-sm-3">
                  <input
                    type="number"
                    name="quantidade"
                    className="w-100 p-2 border-input"
                    placeholder="Qtd."
                    value={v.quantidade}
                    onChange={(e) => handleVariationChange(i, e)}
                  />
                </div>
                <div className="col-sm-3">
                  <input
                    type="number"
                    name="valor"
                    className="w-100 p-2 border-input"
                    placeholder="Valor (R$)"
                    value={v.valor}
                    onChange={(e) => handleVariationChange(i, e)}
                  />
                </div>
                <div className="col-sm-1 text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-danger rounded-5"
                    onClick={() => removeVariation(i)}
                    aria-label="Remover variação"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="w-100 border-input primaria mb-3"
            onClick={addVariation}
          >
            <FontAwesomeIcon icon={faPlus} /> Adicionar Variação
          </button>

          {/* ✨ Footer com botões que usam as props */}
          <footer className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              className="primaria border-input ps-4 pe-4"
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              {isSubmitting ? "Salvando..." : "Salvar Produto"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
