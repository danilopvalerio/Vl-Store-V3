import { useState } from "react";
import "../../public/css/products.css";
import "../../public/css/general.css";

const AddProduct = () => {
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
    const updatedVariations = [...variations];
    updatedVariations.splice(index, 1);
    setVariations(updatedVariations);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/produtos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...productData,
          id_loja: "2e8bb522-62d1-4578-b402-c12f98c0d64a",
          variacoes: variations,
        }),
      });

      if (response.ok) {
        alert("Produto adicionado com sucesso!");
        // Reset form
        setProductData({
          referencia: "",
          nome: "",
          categoria: "",
          material: "",
          genero: "",
        });
        setVariations([
          { descricao_variacao: "", quant_variacao: 0, valor: 0 },
        ]);
      } else {
        throw new Error("Erro ao adicionar produto");
      }
    } catch (err) {
      console.error("Erro:", err);
      alert("Ocorreu um erro ao adicionar o produto");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center w-100">
      <div className="product-page d-flex justify-content-center align-items-center terciary p-4 flex-column rounded-5 white-light">
        <h3 className="col-12 text-center">Adicionar Novo Produto</h3>

        <form
          onSubmit={handleSubmit}
          className="row w-100 justify-content-between"
        >
          <div className="col-12 w-100">
            <div className="row product-info w-100 d-flex justify-content-between align-items-between">
              <div className="mx-auto col-12 p-4 info-base row">
                <h5 className="text-center mb-2">Informações gerais</h5>

                <label className="product-label">Referência:</label>
                <input
                  className="mb-3 produto-input"
                  name="referencia"
                  placeholder="Digite a referência"
                  value={productData.referencia}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Título:</label>
                <input
                  className="mb-3 produto-input"
                  name="nome"
                  placeholder="Digite o nome do produto"
                  value={productData.nome}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Categoria:</label>
                <input
                  className="mb-3 produto-input"
                  name="categoria"
                  placeholder="Digite a categoria"
                  value={productData.categoria}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Material:</label>
                <input
                  className="mb-3 produto-input"
                  name="material"
                  placeholder="Digite o material"
                  value={productData.material}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Gênero (opcional):</label>
                <input
                  className="mb-3 produto-input"
                  name="genero"
                  placeholder="Digite o gênero"
                  value={productData.genero}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12 w-100">
                <h5 className="text-center mb-4">Variações:</h5>

                {variations.map((variation, index) => (
                  <article
                    key={index}
                    className="p-1 mx-auto variacao row align-items-center pb-4 justify-content-evenly mb-2 w-100"
                  >
                    <div className="col-12 col-md-6">
                      <p className="col-12 mt-2 text-center">Descrição</p>
                      <input
                        type="text"
                        className="col-12 produto-input"
                        placeholder="Digite a variação"
                        name="descricao_variacao"
                        value={variation.descricao_variacao}
                        onChange={(e) => handleVariationChange(index, e)}
                        required
                      />
                    </div>

                    <div className="col-6 col-md-2">
                      <p className="col-12 m-2 text-center">Quantidade</p>
                      <input
                        type="number"
                        className="col-12 produto-input"
                        placeholder="Quantidade"
                        name="quant_variacao"
                        value={variation.quant_variacao}
                        onChange={(e) => handleVariationChange(index, e)}
                        required
                        min="0"
                      />
                    </div>

                    <div className="col-6 col-md-2">
                      <p className="col-12 m-2 text-center">Valor</p>
                      <input
                        type="number"
                        className="col-12 produto-input"
                        placeholder="Valor"
                        name="valor"
                        step="0.01"
                        value={variation.valor}
                        onChange={(e) => handleVariationChange(index, e)}
                        required
                        min="0"
                      />
                    </div>

                    <button
                      type="button"
                      className="col-12 col-md-1 mt-4 btn-delete rounded-5 col-md-1"
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
              onClick={() => {
                setProductData({
                  referencia: "",
                  nome: "",
                  categoria: "",
                  material: "",
                  genero: "",
                });
                setVariations([
                  { descricao_variacao: "", quant_variacao: 0, valor: 0 },
                ]);
              }}
            >
              Limpar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
