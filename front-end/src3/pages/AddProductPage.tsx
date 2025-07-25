import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios, { AxiosError } from "axios"; // 1. CORREÇÃO: Importado o tipo AxiosError
import "../../public/css/products.css";
import "../../public/css/general.css";

// Interface para a resposta de erro da API
interface ErrorResponse {
  message: string;
}

const AddProduct = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [productData, setProductData] = useState({
    referencia: "",
    nome: "",
    categoria: "",
    material: "",
    genero: "",
  });

  const [variations, setVariations] = useState([
    { descricao_variacao: "", quant_variacao: 0, valor: 0 },
  ]);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");

    if (!jwtToken || !userData) {
      router.push("/initialPage");
      return;
    }
    // 2. CORREÇÃO: Adicionada a dependência 'router'
  }, [router]);

  const pushBackToProducts = () => {
    router.push("/productsPage");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariationChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const updatedVariations = [...variations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [name]:
        name === "quant_variacao" || name === "valor" ? Number(value) : value,
    };
    setVariations(updatedVariations);
  };

  const addVariation = () => {
    setVariations([
      ...variations,
      { descricao_variacao: "", quant_variacao: 0, valor: 0 },
    ]);
  };

  const removeVariation = (index: number) => {
    if (variations.length <= 1) return;
    const updatedVariations = [...variations];
    updatedVariations.splice(index, 1);
    setVariations(updatedVariations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");

    if (
      !productData.referencia ||
      !productData.nome ||
      !productData.categoria ||
      !productData.material ||
      !productData.genero ||
      variations.some(
        (v) => !v.descricao_variacao || v.quant_variacao <= 0 || v.valor <= 0
      )
    ) {
      setError("Preencha todos os campos obrigatórios corretamente.");
      setLoading(false);
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!jwtToken || !userData) {
      router.push("/initialPage");
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      const idLoja = parsedData.id_loja;

      const payload = {
        ...productData,
        id_loja: idLoja,
        variacoes: variations.map((variation) => ({
          ...variation,
          valor: Number(variation.valor),
        })),
      };

      const response = await axios.post(
        "https://vl-store-v2.onrender.com/api/produtos",
        payload,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          pushBackToProducts();
        }, 3000);
      }
      // 3. CORREÇÃO: Bloco 'catch' tipado corretamente
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverError = error.response?.data as ErrorResponse;
        const errorMessage =
          serverError?.message || "Erro ao adicionar produto.";
        setError(errorMessage);
      } else {
        setError("Ocorreu um erro inesperado ao adicionar o produto.");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setProductData({
      referencia: "",
      nome: "",
      categoria: "",
      material: "",
      genero: "",
    });
    setVariations([{ descricao_variacao: "", quant_variacao: 0, valor: 0 }]);
    setError("");
    setSuccess(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center w-100">
      <div className="product-page d-flex justify-content-center align-items-center terciary p-4 flex-column rounded-5 white-light">
        <h3 className="col-12 text-center">Adicionar Novo Produto</h3>

        {success && (
          <div className="alert alert-success col-12 text-center mt-2">
            Produto cadastrado com sucesso! Redirecionando...
          </div>
        )}

        {error && (
          <div className="alert alert-danger col-12 text-center mt-2">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="row w-100 justify-content-between"
        >
          <div className="col-12 w-100">
            <div className="row product-info w-100 d-flex justify-content-between align-items-between">
              <div className="mx-auto col-12 p-4 info-base row">
                <h5 className="text-center mb-2">Informações gerais</h5>

                <label className="product-label">Referência*:</label>
                <input
                  className="mb-3 produto-input"
                  name="referencia"
                  placeholder="Ex: REF0008"
                  value={productData.referencia}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Nome do Produto*:</label>
                <input
                  className="mb-3 produto-input"
                  name="nome"
                  placeholder="Ex: Camiseta Polo Levi's"
                  value={productData.nome}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Categoria*:</label>
                <input
                  className="mb-3 produto-input"
                  name="categoria"
                  placeholder="Ex: Roupas"
                  value={productData.categoria}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Material*:</label>
                <input
                  className="mb-3 produto-input"
                  name="material"
                  placeholder="Ex: Algodão"
                  value={productData.material}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Gênero:</label>
                <input
                  className="mb-3 produto-input"
                  name="genero"
                  placeholder="Ex: Masculino"
                  value={productData.genero}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12 w-100">
                <h5 className="text-center mb-4">Variações*:</h5>

                {variations.map((variation, index) => (
                  <article
                    key={index}
                    className="p-1 mx-auto variacao row align-items-center pb-4 justify-content-evenly mb-2 w-100"
                  >
                    <div className="col-12 col-md-6">
                      <p className="col-12 mt-2 text-center">Descrição*</p>
                      <input
                        type="text"
                        className="col-12 produto-input"
                        placeholder="Ex: Tamanho GG - Azul"
                        name="descricao_variacao"
                        value={variation.descricao_variacao}
                        onChange={(e) => handleVariationChange(index, e)}
                        required
                      />
                    </div>

                    <div className="col-6 col-md-2">
                      <p className="col-12 m-2 text-center">Quantidade*</p>
                      <input
                        type="number"
                        className="col-12 produto-input"
                        placeholder="Ex: 10"
                        name="quant_variacao"
                        value={variation.quant_variacao || ""}
                        onChange={(e) => handleVariationChange(index, e)}
                        required
                        min="0"
                      />
                    </div>

                    <div className="col-6 col-md-2">
                      <p className="col-12 m-2 text-center">Valor* (R$)</p>
                      <input
                        type="number"
                        className="col-12 produto-input"
                        placeholder="Ex: 79.90"
                        name="valor"
                        step="0.01"
                        value={variation.valor || ""}
                        onChange={(e) => handleVariationChange(index, e)}
                        required
                        min="0"
                      />
                    </div>

                    <button
                      type="button"
                      className="col-12 col-md-1 mt-4 btn-delete rounded-5"
                      onClick={() => removeVariation(index)}
                      disabled={variations.length <= 1}
                    >
                      X
                    </button>
                  </article>
                ))}

                <button
                  type="button"
                  className="down-btn btn col-12 col-md-3 primaria"
                  onClick={addVariation}
                >
                  Adicionar Variação
                </button>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between w-100 mt-3">
            <button
              type="button"
              className="down-btn btn col-12 col-md-3 primaria"
              onClick={clearForm}
            >
              Limpar
            </button>

            <button
              type="button"
              className="down-btn btn col-12 col-md-3 primaria"
              onClick={pushBackToProducts}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="down-btn btn col-12 col-md-3 primaria"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
