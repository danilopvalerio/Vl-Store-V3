// products/ProductDetailModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";

// --- Interfaces ---
interface Variation {
  id_variacao?: string;
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
  variacoes?: Variation[];
}

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onProductUpdate: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onProductUpdate,
}) => {
  const [productData, setProductData] = useState<Product | null>(null);
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);
  const [currentVariations, setCurrentVariations] = useState<Variation[]>([]);
  const [originalVariations, setOriginalVariations] = useState<Variation[]>([]);
  const [deletedVariationIds, setDeletedVariationIds] = useState<string[]>([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // ➕ Estado para controlar o loading das ações de salvar/deletar
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setProductData({ ...product });
      setOriginalProduct({ ...product });
      setCurrentVariations([]);
      setOriginalVariations([]);
      setDeletedVariationIds([]);
      setIsLoadingVariations(true);

      const fetchVariations = async () => {
        try {
          const response = await api.get(
            `/produtos/${product.referencia}/variacoes`
          );
          const fetchedVariations = response.data || [];
          setCurrentVariations(fetchedVariations);
          setOriginalVariations(fetchedVariations);
        } catch (err) {
          console.error("Erro ao buscar variações:", err);
          setError("Não foi possível carregar as variações.");
        } finally {
          setIsLoadingVariations(false);
        }
      };
      fetchVariations();
    }
  }, [product]);

  const hasUnsavedChanges = useMemo(() => {
    if (!originalProduct) return false;
    const productChanged =
      productData?.nome !== originalProduct.nome ||
      productData?.categoria !== originalProduct.categoria ||
      productData?.material !== originalProduct.material ||
      productData?.genero !== originalProduct.genero;
    if (productChanged) return true;
    if (deletedVariationIds.length > 0) return true;
    if (currentVariations.length !== originalVariations.length) return true;
    const variationsChanged = currentVariations.some((currentVar) => {
      if (!currentVar.id_variacao) return true;
      const originalVar = originalVariations.find(
        (v) => v.id_variacao === currentVar.id_variacao
      );
      if (!originalVar) return true;
      return (
        currentVar.descricao !== originalVar.descricao ||
        Number(currentVar.quantidade) !== Number(originalVar.quantidade) ||
        Number(currentVar.valor) !== Number(originalVar.valor)
      );
    });
    return variationsChanged;
  }, [
    productData,
    originalProduct,
    currentVariations,
    originalVariations,
    deletedVariationIds,
  ]);

  const handleGeneralChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!productData) return;
    const { name, value } = e.target;
    setProductData({ ...productData, [name]: value });
  };

  const handleVariationChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const updatedVariations = [...currentVariations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [name]: name === "descricao" ? value : parseFloat(value) || 0,
    };
    setCurrentVariations(updatedVariations);
  };

  const showMessage = (setter: Function, message: string) => {
    setter(message);
    setTimeout(() => setter(""), 3000);
  };

  const addVariation = () => {
    const newVariation: Variation = {
      descricao: "",
      quantidade: 0,
      valor: "",
    };
    setCurrentVariations([...currentVariations, newVariation]);
  };

  const removeVariation = async (index: number) => {
    const varToRemove = currentVariations[index];
    if (varToRemove.id_variacao) {
      setDeletedVariationIds([...deletedVariationIds, varToRemove.id_variacao]);
    }
    setCurrentVariations(currentVariations.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!productData || isSubmitting) return;

    if (
      !window.confirm(
        "Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/produtos/${productData.referencia}`);
      showMessage(setSuccess, "Produto deletado com sucesso!");
      onProductUpdate();
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error("Erro ao deletar produto:", err);
      showMessage(setError, "Não foi possível deletar o produto.");
      setIsSubmitting(false); // Libera a UI em caso de erro
    }
  };

  const handleSave = async () => {
    if (!productData || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const apiPromises: Promise<any>[] = [];

      if (JSON.stringify(productData) !== JSON.stringify(originalProduct)) {
        apiPromises.push(
          api.patch(`/produtos/${productData.referencia}`, {
            nome: productData.nome,
            categoria: productData.categoria,
            material: productData.material,
            genero: productData.genero,
            idLoja: productData.idLoja,
          })
        );
      }

      const variationsToCreate = currentVariations.filter(
        (v) => !v.id_variacao
      );
      for (const v of variationsToCreate) {
        apiPromises.push(
          api.post("/variacoes", {
            referenciaProduto: productData.referencia,
            ...v,
          })
        );
      }

      const variationsToUpdate = currentVariations.filter((currentVar) => {
        if (!currentVar.id_variacao) return false;
        const originalVar = originalVariations.find(
          (v) => v.id_variacao === currentVar.id_variacao
        );
        return (
          originalVar &&
          JSON.stringify(currentVar) !== JSON.stringify(originalVar)
        );
      });
      for (const v of variationsToUpdate) {
        apiPromises.push(api.patch(`/variacoes/${v.id_variacao}`, v));
      }

      for (const id of deletedVariationIds) {
        apiPromises.push(api.delete(`/variacoes/${id}`));
      }

      await Promise.all(apiPromises);
      showMessage(setSuccess, "Alterações salvas com sucesso!");
      onProductUpdate();
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      showMessage(setError, "Erro ao salvar as alterações.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!productData) return null;

  return (
    <div className="modal-content rounded-4">
      <header className="w-100 terciary p-3 d-flex justify-content-between align-items-center">
        <h4 className="m-0 w-100 text-center primary-color">
          Detalhes do Produto
        </h4>
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
          <div className="row g-3 mb-4">
            {/* Campos de Nome, Categoria, Material, Gênero... */}
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
                onChange={handleGeneralChange}
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
                onChange={handleGeneralChange}
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
                onChange={handleGeneralChange}
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
                value={productData.genero}
                onChange={handleGeneralChange}
                required
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Unissex">Unissex</option>
              </select>
            </div>
          </div>

          <h5 className="mb-3">Variações</h5>
          <div className="variations-container">
            {isLoadingVariations ? (
              <p>Carregando variações...</p>
            ) : (
              currentVariations.map((v, i) => (
                <div
                  key={v.id_variacao || `new-${i}`}
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
                      type="text"
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
              ))
            )}
            {!isLoadingVariations && currentVariations.length === 0 && (
              <p className="text-muted">
                Nenhuma variação encontrada para este produto.
              </p>
            )}
          </div>

          <button
            type="button"
            className="w-100 border-input primaria mb-3"
            onClick={addVariation}
          >
            <FontAwesomeIcon icon={faPlus} /> Adicionar Variação
          </button>

          <footer className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              className="primaria border-input ps-2 pe-2"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="primaria border-input ps-2 pe-2"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deletando..." : "Deletar"}
            </button>
            <button
              type="button"
              className="primaria border-input ps-2 pe-2"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ProductDetailModal;
