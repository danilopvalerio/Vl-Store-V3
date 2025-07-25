"use client";

import { useRouter } from "next/navigation";
import axios from "axios";

export interface ProdutoCreateDTO {
  referencia: string;
  nome: string;
  categoria: string;
  material: string;
  genero: string;
  idLoja: string;
}

interface ProductCardProps {
  product: ProdutoCreateDTO;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();

  const openDetailedProduct = async (referencia: string) => {
    let accessToken = sessionStorage.getItem("accessToken");

    try {
      const product = await fetchProduct(accessToken!, referencia);
      localStorage.setItem("selectedProduct", JSON.stringify(product));
      router.push("/productDetail");
    } catch (error: any) {
      if (error.response?.status === 401) {
        try {
          const refreshResponse = await axios.post(
            "http://localhost:3000/api/sessions/refresh",
            {},
            { withCredentials: true }
          );

          accessToken = refreshResponse.data.access_token;
          if (accessToken) {
            sessionStorage.setItem("accessToken", accessToken);
            const product = await fetchProduct(accessToken, referencia);
            localStorage.setItem("selectedProduct", JSON.stringify(product));
            router.push("/productDetail");
          } else {
            router.push("/login");
          }
        } catch {
          router.push("/login");
        }
      } else {
        alert("Erro desconhecido, tente novamente mais tarde.");
      }
    }
  };

  const fetchProduct = async (token: string, referencia: string) => {
    const userData = localStorage.getItem("userData");
    if (!userData) throw new Error("Usuário não autenticado");

    const { id_loja } = JSON.parse(userData);

    const response = await axios.get(
      `http://localhost:3000/api/produtos/loja/${id_loja}/referencia/${referencia}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  };

  return (
    <div className="col-12 col-md-4 col-lg-3">
      <div
        className="rounded-5 card-item quartenary shadow-sm h-100 d-flex flex-column justify-content-between p-4"
        onClick={() => openDetailedProduct(product.referencia)}
        style={{ cursor: "pointer" }}
      >
        <div>
          <h5 className="card-title mb-3">{product.nome}</h5>
          <p className="text-muted mb-1">
            <strong>Categoria:</strong> {product.categoria}
          </p>
          <p className="text-muted mb-3">
            <strong>Material:</strong> {product.material}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
