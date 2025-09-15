# VL Store - Sistema de Gestão Comercial

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)

VL Store é um software de gestão comercial simplificado, projetado para oferecer a pequenos comércios uma solução eficiente para o gerenciamento de produtos, funcionários, vendas e caixa. Focado em usabilidade e escalabilidade, o sistema proporciona ao gestor controle total e visibilidade sobre as operações do seu negócio.

Link de acesso: https://vl-store-v3.vercel.app/login

## Sobre o desenvolvimento do projeto

A concepção deste projeto teve origem em uma ideia própria, idealizada e estruturada por mim, com o objetivo de propor um sistema que ne encaixasse no âmbito da disciplina de Programação Web, oferecida no curso de Bacharelado em Computação da Universidade Estadual da Paraíba (UEPB), sob a orientação do Prof. Allan Vilar de Carvalho, que posteriormente foi substituído pela Proff. Ana Isabella Muniz Leite. Desde o início, o projeto refletiu minha iniciativa e visão sobre como integrar conceitos teóricos adquiridos ao longo do curso em um sistema funcional e tecnicamente consistente.

A primeira versão do projeto foi desenvolvida em caráter colaborativo, dentro de um grupo de trabalho, e com prazo acadêmico limitado, o que resultou em um protótipo funcional, mas com diversas restrições. Entre essas limitações estavam a arquitetura pouco modular, funcionalidades incompletas, inconsistências na interface com o usuário, dificuldades na manutenção, problemas na segurança e na escalabilidade do código. Embora essa versão inicial tenha cumprido parcialmente os requisitos acadêmicos, tornou-se evidente a necessidade de um esforço adicional para atingir um nível mais elevado de qualidade, eficiência e robustez técnica. Além disso, optei por reconstruir o projeto do zero com o objetivo de aprofundar meu aprendizado prático em desenvolvimento web, permitindo que eu aplicasse de forma direta os conceitos estudados, explorasse novas abordagens de programação e aprimorasse minhas habilidades em arquitetura de software, segurança, manutenção e escalabilidade.

Diante desse cenário, optei por reconstruir integralmente o projeto de forma individual, retomando desde sua concepção arquitetural até a implementação detalhada de todas as funcionalidades. Essa abordagem permitiu um aprimoramento profundo da estrutura do sistema, garantindo maior coesão, modularidade e organização do código, bem como a implementação de práticas de desenvolvimento modernas. Além disso, possibilitou corrigir falhas e limitações da versão anterior, otimizar a experiência do usuário e incorporar melhorias funcionais que aumentam significativamente a aplicabilidade e a confiabilidade do projeto.

Todo o desenvolvimento desta versão final reflete não apenas a execução da ideia original, mas também o esforço contínuo de aperfeiçoamento técnico e de maturidade na tomada de decisões de projeto, alinhando o produto às melhores práticas de desenvolvimento web contemporâneo. Assim, o projeto final representa uma síntese entre inovação, autoria intelectual e rigor técnico, consolidando uma solução mais completa, robusta e profissional do que a versão inicial, demonstrando claramente a evolução do conceito original até sua materialização prática.

## 🚀 Acesso ao Projeto

Acesse a aplicação em produção através do link:
**[https://vl-store-v3.vercel.app/login](https://vl-store-v3.vercel.app/login)**

## ✨ Funcionalidades Principais

O sistema foi desenvolvido com um conjunto robusto de funcionalidades para atender às necessidades de gerenciamento de um pequeno comércio.

### Gerenciamento de Produtos

- **CRUD completo de produtos:** Crie, leia, atualize e delete produtos.
- **Variações:** Adicione múltiplas variações (cor, tamanho, etc.) para cada produto, com controle de estoque e preço individual.
- **Busca e Filtragem:** Encontre produtos facilmente por título, categoria ou referência.
- **Controle de Acesso:** Apenas administradores podem criar, editar ou excluir produtos.

### Controle de Funcionários

- **CRUD de funcionários:** Gerencie o cadastro completo da sua equipe.
- **Perfis de Usuário:** Diferenciação de permissões entre **Administrador** e **Vendedor**.
- **Segurança:** Senhas são criptografadas e seguem regras de formatação para maior segurança.

### Gerenciamento de Vendas

- **Registro de Vendas:** Vendedores podem registrar suas vendas de forma rápida e intuitiva.
- **Histórico e Detalhamento:** Administradores têm acesso a um histórico completo de todas as vendas, com filtros por vendedor e forma de pagamento.
- **Controle de Permissões:** Vendedores só podem visualizar suas próprias vendas, enquanto administradores possuem visão global.

### Controle de Caixa

- **Movimentações Financeiras:** Registre entradas e saídas do caixa.
- **Fechamento Diário:** Realize o fechamento do caixa para consolidar o balanço do dia.
- **Rastreabilidade:** Associe entradas de caixa a vendas específicas para um controle financeiro preciso.

### Relatórios Estratégicos

- **Produtos Mais Vendidos:** Gráficos e tabelas para identificar os produtos de maior sucesso.
- **Desempenho de Vendedores:** Ranking e análise de vendas por funcionário.
- **Relatório Financeiro:** Resumo de entradas, saídas e saldo final por período.
- **Vendas por Forma de Pagamento:** Entenda como seus clientes preferem pagar.
- **Alerta de Baixo Estoque:** Gere relatórios de produtos que precisam de reposição.
- **Exportação:** Exporte todos os relatórios para **PDF**.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído com tecnologias modernas, visando performance, segurança e uma ótima experiência de desenvolvimento.

- **Frontend:**

  - **React:** Biblioteca para construção de interfaces de usuário.
  - **Next.js:** Framework React para renderização no servidor, otimização e roteamento.
  - **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
  - **Bootstrap:** Framework CSS para estilização e responsividade.

- **Backend:**

  - **Node.js:** Ambiente de execução JavaScript no lado do servidor.
  - **Express.js:** Framework para a construção da API RESTful.
  - **TypeScript:** Para um código mais robusto e seguro no backend.
  - **JWT (JSON Web Token):** Para autenticação e autorização de rotas.
  - **Bcrypt:** Para criptografia e segurança das senhas.

- **Banco de Dados:**

  - **PostgreSQL:** Banco de dados relacional robusto e confiável para persistência dos dados.

- **Versionamento:**
  - **Git & GitHub:** Para controle de versão e colaboração no código-fonte.

## 🏗️ Arquitetura

O projeto foi estruturado com uma separação clara de responsabilidades entre o frontend e o backend.

### Backend (API RESTful)

A API segue uma **arquitetura em camadas** para garantir organização, manutenibilidade e escalabilidade.

- **`Routes`**: Define os endpoints da API e os direciona para os `Controllers` correspondentes.
- **`Controllers`**: Recebem as requisições, validam os dados de entrada e invocam os `Services` para executar a lógica de negócio.
- **`Services`**: Contêm a lógica de negócio da aplicação. Interagem com os `Models` para acessar e manipular os dados.
- **`Models`**: Representam a estrutura dos dados e são responsáveis pela comunicação com o banco de dados (PostgreSQL).
- **`Middlewares`**: Funções que interceptam as requisições para tarefas como autenticação (verificação de JWT), tratamento de erros, etc.
- **`Database`**: Contém a configuração e a conexão com o banco de dados.

### Frontend (Next.js)

O frontend utiliza a estrutura do **App Router** do Next.js, organizando o código por funcionalidades.

- **`app/`**: Diretório principal que contém as rotas da aplicação.
  - **`app/(feature)/page.tsx`**: Cada rota principal (ex: `/products`, `/login`) tem sua própria pasta. O arquivo `page.tsx` é o ponto de entrada daquela página.
  - **`app/(feature)/components/`**: Dentro de cada pasta de funcionalidade, há uma pasta `components` que armazena os componentes React específicos daquela página (ex: `AddProductModal.tsx`, `ProductCardComponent.tsx`), promovendo a modularidade e o reuso.

## ⚙️ Como Executar o Projeto Localmente

Siga os passos abaixo para configurar e executar o projeto em sua máquina.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
- Uma instância do [PostgreSQL](https://www.postgresql.org/) rodando localmente ou em um serviço de nuvem.

### 1. Clonar o Repositório

```bash
git clone [https://github.com/seu-usuario/vl-store.git](https://github.com/seu-usuario/vl-store.git)
cd vl-store
```

### 2. Configurar o Backend

```bash
cd backend
npm install
```

- Crie um arquivo .env na raiz da pasta backend a partir do exemplo .env.example.

- Preencha as variáveis de ambiente com os dados de conexão do seu banco de dados PostgreSQL e uma chave secreta para o JWT.

- Execute as migrações do banco de dados (se aplicável).

### 3. Configurar o Frontend

```bash
cd ../frontend
npm install
```

- Crie um arquivo .env.local na raiz da pasta frontend (se necessário) para apontar para a URL da sua API backend.

### 4. Iniciar os Servidores

```bash
cd backend
npm run dev
```

- Para iniciar o servidor frontend:

```bash
cd frontend
npm run dev
```

Abra http://localhost:3000 no seu navegador para ver a aplicação rodando!

## 👥 Autor

Danilo Pedro da Silva Valério

---
