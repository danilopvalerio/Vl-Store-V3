"use client";
import { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import ProductVariations from "./ProductVariations";

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
}

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onProductUpdate: () => void;
  userRole: "admin" | "employee";
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onProductUpdate,
  userRole,
}) => {
  const [productData, setProductData] = useState<Product | null>(null);
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);
  const [currentVariations, setCurrentVariations] = useState<Variation[]>([]);
  const [originalVariations, setOriginalVariations] = useState<Variation[]>([]);
  const [deletedVariationIds, setDeletedVariationIds] = useState<string[]>([]);
  const [variationErrors, setVariationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (product) {
      setProductData({ ...product });
      setOriginalProduct({ ...product });
      setDeletedVariationIds([]);
    }
  }, [product]);

  // Atualiza originalVariations na primeira vez que currentVariations chega
  useEffect(() => {
    if (currentVariations.length > 0 && originalVariations.length === 0) {
      setOriginalVariations(currentVariations.map((v) => ({ ...v })));
    }
  }, [currentVariations, originalVariations.length]);

  const hasUnsavedChanges = useMemo(() => {
    if (!originalProduct || userRole === "employee") return false;

    const productChanged =
      productData?.nome !== originalProduct.nome ||
      productData?.categoria !== originalProduct.categoria ||
      productData?.material !== originalProduct.material ||
      productData?.genero !== originalProduct.genero;

    if (productChanged || deletedVariationIds.length > 0) return true;
    if (currentVariations.length !== originalVariations.length) return true;

    return currentVariations.some((currentVar) => {
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
  }, [
    productData,
    originalProduct,
    currentVariations,
    originalVariations,
    deletedVariationIds,
    userRole,
  ]);

  const handleGeneralChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!productData || userRole === "employee") return;
    const { name, value } = e.target;
    setProductData({ ...productData, [name]: value });
  };

  const validateVariations = (): string | null => {
    for (const v of currentVariations) {
      if (!v.descricao || v.descricao.trim() === "")
        return "Descrição não pode ficar vazia.";
      if (Number(v.valor) <= 0) return "Valor deve ser maior que 0.";
    }
    return null;
  };

  const handleSave = async () => {
    if (!productData || isSubmitting || userRole === "employee") return;

    const validationError = validateVariations();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const apiPromises: Promise<unknown>[] = [];

      // Atualiza dados do produto
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

      // Criar novas variações
      const variationsToCreate = currentVariations.filter(
        (v) => !v.id_variacao
      );
      variationsToCreate.forEach((v) =>
        apiPromises.push(
          api.post("/variacoes", {
            referenciaProduto: productData.referencia,
            ...v,
          })
        )
      );

      // Atualizar variações existentes
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
      variationsToUpdate.forEach((v) =>
        apiPromises.push(api.patch(`/variacoes/${v.id_variacao}`, v))
      );

      // Deletar variações removidas
      deletedVariationIds.forEach((id) =>
        apiPromises.push(api.delete(`/variacoes/${id}`))
      );

      const results = await Promise.all(apiPromises);
      results.forEach((res) => {
        if (res && typeof res === "object") {
          console.log("API response ok", res);
        }
      });

      setSuccess("Alterações salvas com sucesso!");
      onProductUpdate();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(
        "Erro ao salvar as alterações. Verifique os campos e tente novamente."
      );
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
            <div className="col-md-12">
              <label htmlFor="referencia" className="form-label ps-2">
                Referência
              </label>
              <input
                id="referencia"
                name="referencia"
                className="w-100 p-2 border-input fw-bold"
                value={productData.referencia}
                disabled
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
                value={productData.nome}
                onChange={handleGeneralChange}
                disabled={userRole === "employee"}
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
                value={productData.categoria}
                onChange={handleGeneralChange}
                disabled={userRole === "employee"}
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
                value={productData.material}
                onChange={handleGeneralChange}
                disabled={userRole === "employee"}
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
                disabled={userRole === "employee"}
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Unissex">Unissex</option>
              </select>
            </div>
          </div>

          <ProductVariations
            referenciaProduto={productData.referencia}
            userRole={userRole}
            currentVariations={currentVariations}
            setCurrentVariations={setCurrentVariations}
            deletedVariationIds={deletedVariationIds}
            setDeletedVariationIds={setDeletedVariationIds}
            variationErrors={variationErrors}
            setVariationErrors={setVariationErrors}
          />

          {userRole === "admin" && (
            <footer className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                className="primaria border-input ps-2 pe-2"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </button>
            </footer>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProductDetailModal;
