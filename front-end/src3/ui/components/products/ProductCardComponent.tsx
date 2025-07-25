import { useRouter } from "next/router";
import { ProductCardProps } from "../../../domain/interfaces/products-interface";
import axios from "axios";

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();

  const openDetailedProduct = async (referencia: string) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      const userData = localStorage.getItem("userData");

      if (!jwtToken || !userData) {
        console.error("Usuário não autenticado.");
        return;
      }

      const { id_loja } = JSON.parse(userData);

      const response = await axios.get(
        `https://vl-store-v2.onrender.com/api/produtos/loja/${id_loja}/referencia/${referencia}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          timeout: 2000,
        }
      );

      // Salvar no localStorage
      localStorage.setItem("selectedProduct", JSON.stringify(response.data));

      router.push("productDetail");
    } catch (error) {
      alert("Erro desconhecido, tente novamente mais tarde.");
    }
  };

  return (
    <div className="col-12 col-md-3 product-card rounded-5 p-3 d-flex justify-content-center flex-column">
      <p className="mt-2 card-title secondary p-1 m-1">{product.nome}</p>
      <p className="card-title secondary p-1 m-1">
        Categoria: {product.categoria}
      </p>
      <p className="card-title secondary p-1 m-1">
        Material: {product.material}
      </p>
      <button
        className="btn primaria w-100 mt-2"
        onClick={() => openDetailedProduct(product.referencia)}
      >
        Detalhes
      </button>
    </div>
  );
};

export default ProductCard;
