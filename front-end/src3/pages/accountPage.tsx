import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import "../../public/css/products.css";
import "../../public/css/general.css";

interface StoreData {
  nome: string;
  senha: string;
  email: string;
  cpf_cnpj_proprietario_loja: string;
  data_nasc_proprietario: string;
  telefone: string;
  id_loja: string;
}

const AccountPage = () => {
  const router = useRouter();

  const [storeData, setStoreData] = useState<StoreData>({
    nome: "",
    senha: "",
    email: "",
    cpf_cnpj_proprietario_loja: "",
    data_nasc_proprietario: "",
    telefone: "",
    id_loja: "",
  });

  const [originalData, setOriginalData] = useState<StoreData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("userData");
    if (!jwtToken || !userData) router.push("/initialPage");
    // 1. CORREÇÃO: Adicionada a dependência 'router'
  }, [router]);

  const getAuthHeaders = () => {
    const jwtToken = localStorage.getItem("jwtToken");
    return {
      Authorization: `Bearer ${jwtToken}`,
      "Content-Type": "application/json",
    };
  };

  const getStore = async () => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      const userData = localStorage.getItem("userData");

      if (!jwtToken || !userData) {
        console.error("Usuário não autenticado.");
        return;
      }

      const { id_loja } = JSON.parse(userData);

      const response = await axios.get(
        `https://vl-store-v2.onrender.com/api/lojas/${id_loja}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          timeout: 2000,
        }
      );

      localStorage.setItem("selectedStore", JSON.stringify(response.data));
      return response.data;
      // 2. CORREÇÃO: Variável 'error' utilizada no console.error
    } catch (err) {
      console.error("Erro ao buscar dados da loja:", err);
      alert("Erro desconhecido, tente novamente mais tarde.");
    }
  };

  useEffect(() => {
    const loadStoreData = async () => {
      const storeResponse = await getStore();

      if (storeResponse && storeResponse.data) {
        const data = storeResponse.data;
        const parsed = {
          nome: data.nome || "",
          senha: data.senha || "",
          email: data.email || "",
          cpf_cnpj_proprietario_loja: data.cpf_cnpj_proprietario_loja || "",
          data_nasc_proprietario: data.data_nasc_proprietario || "",
          telefone: data.telefone || "",
          id_loja: data.id_loja || "",
        };
        setStoreData(parsed);
        setOriginalData(parsed);
      } else {
        const cachedStore = localStorage.getItem("selectedStore");
        if (cachedStore) {
          try {
            const parsedCachedStore = JSON.parse(cachedStore);
            if (parsedCachedStore.data) {
              const data = parsedCachedStore.data;
              const parsed = {
                nome: data.nome || "",
                senha: data.senha || "",
                email: data.email || "",
                cpf_cnpj_proprietario_loja:
                  data.cpf_cnpj_proprietario_loja || "",
                data_nasc_proprietario: data.data_nasc_proprietario || "",
                telefone: data.telefone || "",
                id_loja: data.id_loja || "",
              };
              setStoreData(parsed);
              setOriginalData(parsed);
            }
          } catch (parseError) {
            console.error(
              "Erro ao parsear dados da loja do localStorage:",
              parseError
            );
            setError("Erro ao carregar dados armazenados da loja.");
          }
        }
      }
    };

    loadStoreData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStoreData((prev) => ({ ...prev, [name]: value }));
  };

  const hasStoreDataChanged = () => {
    if (!originalData) return false;
    return JSON.stringify(originalData) !== JSON.stringify(storeData);
  };

  const saveChanges = async () => {
    try {
      setIsSaving(true);

      // 3. CORREÇÃO: 'senha' renomeada para '_senha' para indicar que não é usada.
      const { senha: _senha, ...dataWithoutPassword } = storeData;

      await axios.patch(
        `https://vl-store-v2.onrender.com/api/lojas/${storeData.id_loja}`,
        dataWithoutPassword, // envia sem a senha
        { headers: getAuthHeaders() }
      );

      localStorage.setItem("userData", JSON.stringify(storeData));
      setOriginalData(storeData);
    } catch (err) {
      console.error("Erro ao salvar loja:", err);
      setError("Erro ao salvar loja");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackClick = async () => {
    if (hasStoreDataChanged()) {
      await saveChanges();
    }
    router.push("/menuPage");
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const deleteStore = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(
        `https://vl-store-v2.onrender.com/api/lojas/${storeData.id_loja}`,
        { headers: getAuthHeaders() }
      );
      // Limpa o localStorage ao deletar a conta
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("selectedStore");

      router.push("/initialPage"); // redireciona para a página inicial
    } catch (err) {
      console.error("Erro ao deletar loja:", err);
      setError("Erro ao deletar loja");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center w-100">
      <div className="product-page d-flex justify-content-center align-items-center terciary p-4 flex-column rounded-5 white-light">
        <h3 className="col-12 text-center">Editar Loja</h3>

        {error && (
          <div className="alert alert-danger col-12 text-center mt-2">
            {error}
          </div>
        )}

        {isSaving && (
          <div className="alert alert-info col-12 text-center mt-2">
            Salvando dados...
          </div>
        )}
        {isDeleting && (
          <div className="alert alert-info col-12 text-center mt-2">
            Deletando conta...
          </div>
        )}

        <form className="row w-100 justify-content-between">
          <div className="col-12 w-100">
            <div className="row product-info w-100 d-flex justify-content-between align-items-between">
              <div className="mx-auto col-12 p-4 info-base row">
                <h5 className="text-center mb-2">Informações gerais</h5>

                <label className="product-label">Nome da loja:</label>
                <input
                  className="mb-3 produto-input"
                  name="nome"
                  placeholder="Nome"
                  value={storeData.nome}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">CPF/CNPJ*:</label>
                <input
                  className="mb-3 produto-input"
                  name="cpf_cnpj_proprietario_loja"
                  placeholder="Digite o CPF ou CNPJ"
                  value={storeData.cpf_cnpj_proprietario_loja}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Email:</label>
                <input
                  className="mb-3 produto-input"
                  name="email"
                  placeholder="Digite o email"
                  value={storeData.email}
                  onChange={handleChange}
                  required
                />

                <label className="product-label">Telefone:</label>
                <input
                  className="mb-3 produto-input"
                  name="telefone"
                  placeholder="Ex: (99) 99999-9999"
                  value={storeData.telefone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between w-100 mt-3">
            <button
              type="button"
              className="down-btn btn col-12 col-md-3 primaria"
              onClick={handleBackClick}
              disabled={isSaving}
            >
              Voltar
            </button>

            <button
              type="button"
              className="down-btn btn col-12 col-md-3 primaria"
              onClick={deleteStore}
            >
              Deletar Loja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountPage;
