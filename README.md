# PetShop API

API REST para gerenciamento de **clientes** e seus **pets**, desenvolvida com Node.js, Express e TypeScript, utilizando o **Supabase** (PostgreSQL) como banco de dados.

> Trabalho da disciplina de **Desenvolvimento Back-End** — Engenharia de Software, 4P, Turma B (sex).

---

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Integrantes da equipe](#integrantes-da-equipe)
- [Tecnologias](#tecnologias)
- [Entidades e relacionamento](#entidades-e-relacionamento)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e configuração](#instalação-e-configuração)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Executando o projeto](#executando-o-projeto)
- [Endpoints da API](#endpoints-da-api)
- [Exemplos de uso](#exemplos-de-uso)
- [Códigos de resposta](#códigos-de-resposta)

---

## Sobre o projeto

O **PetShop API** é uma API REST para o domínio de **pet shop**. Ela resolve o problema do controle manual de cadastros, permitindo registrar os clientes da loja e os animais (pets) de cada cliente em um banco de dados.

**Objetivo:** oferecer operações completas de cadastro, consulta, atualização e exclusão (CRUD) de clientes e pets, além de pesquisa por palavra-chave, servindo de base para futuras evoluções (agendamentos, serviços, produtos).

---

## Integrantes da equipe

- Lívia Moreira Parra
- Lohanna Pereira dos Santos

---

## Tecnologias

| Tecnologia | Uso |
| --- | --- |
| [Node.js](https://nodejs.org/) | Ambiente de execução |
| [TypeScript](https://www.typescriptlang.org/) | Linguagem |
| [Express 5](https://expressjs.com/) | Framework web |
| [Supabase](https://supabase.com/) (`@supabase/supabase-js`) | Plataforma de banco de dados |
| [PostgreSQL](https://www.postgresql.org/) | Banco de dados relacional (via Supabase) |
| [tsx](https://tsx.is/) | Execução de TypeScript em desenvolvimento |
| [dotenv](https://github.com/motdotla/dotenv) | Variáveis de ambiente |
| [uuid](https://github.com/uuidjs/uuid) | Geração de identificadores |
| [Git](https://git-scm.com/) | Versionamento de código |

---

## Entidades e relacionamento

### Cliente

| Atributo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | Identificador único |
| nome | texto | Nome do cliente |
| email | texto | E-mail do cliente |
| telefone | texto | Telefone do cliente |
| activo | booleano | Indica se o cliente está ativo |

### Pet

| Atributo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | Identificador único |
| cliente_id | UUID | Chave estrangeira para `clientes.id` |
| nome | texto | Nome do pet |
| especie | texto | Espécie (cachorro, gato...) |
| raca | texto | Raça do pet |
| idade | inteiro | Idade do pet |
| activo | booleano | Indica se o pet está ativo |

### Relacionamento

Um **Cliente** pode possuir vários **Pets**, e cada **Pet** pertence a um único **Cliente** (relação 1:N), por meio da chave estrangeira `pets.cliente_id`.

---

## Estrutura do projeto

O projeto segue uma organização em camadas (rotas → controllers → models):

```
PetShop/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Cliente de conexão com o Supabase
│   ├── controller/
│   │   ├── ClienteController.ts # Regras de entrada/saída HTTP de clientes
│   │   └── PetController.ts     # Regras de entrada/saída HTTP de pets
│   ├── models/
│   │   ├── Cliente.ts           # Acesso ao banco (tabela clientes)
│   │   └── Pet.ts               # Acesso ao banco (tabela pets)
│   ├── routes/
│   │   ├── Clientesroutes.ts    # Rotas de /clientes
│   │   └── Petroutes.ts         # Rotas de /pets
│   ├── app.ts                   # Configuração do Express e registro das rotas
│   └── server.ts                # Inicialização do servidor
├── .env                         # Variáveis de ambiente reais (não versionado)
├── .env.example                 # Modelo das variáveis de ambiente
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Pré-requisitos

- **Node.js 20.6 ou superior** (o script de desenvolvimento usa a flag `--env-file`)
- **npm**
- Um projeto no [Supabase](https://supabase.com/) com as tabelas `clientes` e `pets`

---

## Instalação e configuração

1. **Clone o repositório e acesse a pasta:**

```bash
git clone https://github.com/livis30-glitch/Petshop.git
cd Petshop
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Configure as variáveis de ambiente:** copie o arquivo `.env.example` para `.env` e preencha com as credenciais do seu projeto Supabase (veja a próxima seção).

---

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `SUPABASE_URL` | URL do projeto no Supabase |
| `SUPABASE_SECRET_KEY` | Chave secreta do Supabase |

Exemplo do arquivo `.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sua-chave-secreta
```

> **Nunca** compartilhe nem versione a `SUPABASE_SECRET_KEY`. O arquivo `.env` já está listado no `.gitignore`. Apenas o `.env.example`, sem credenciais reais, fica no repositório.

---

## Banco de dados

A API utiliza duas tabelas no Supabase. Script SQL para criar a estrutura:

```sql
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  telefone text not null,
  activo boolean not null default true
);

create table pets (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id),
  nome text not null,
  especie text not null,
  raca text not null,
  idade integer not null,
  activo boolean not null default true
);
```

**Relacionamento:** um cliente pode ter vários pets (`pets.cliente_id → clientes.id`).

---

## Executando o projeto

### Desenvolvimento (com recarga automática)

```bash
npm run dev
```

### Produção

```bash
npm run build   # compila o TypeScript para a pasta dist/
npm start       # executa dist/server.js
```

> Ao usar `npm start`, garanta que as variáveis `SUPABASE_URL` e `SUPABASE_SECRET_KEY` estejam definidas no ambiente.

O servidor sobe em: **http://localhost:3000**

### Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor em modo de desenvolvimento, carregando o `.env` e reiniciando a cada alteração |
| `npm run build` | Compila o projeto TypeScript |
| `npm start` | Executa a versão compilada |

---

## Endpoints da API

### Raiz

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/` | Retorna o nome e a versão da API |

### Clientes — `/clientes`

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/clientes` | Lista todos os clientes |
| `GET` | `/clientes/search/:keyword` | Busca por nome, e-mail ou telefone (ordenado por nome) |
| `GET` | `/clientes/:id` | Busca um cliente pelo ID |
| `POST` | `/clientes` | Cadastra um novo cliente |
| `PUT` | `/clientes/:id` | Atualiza um cliente |
| `DELETE` | `/clientes/:id` | Remove um cliente |

**Corpo (JSON) para `POST` e `PUT`:**

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "telefone": "(41) 99999-0000",
  "activo": true
}
```

### Pets — `/pets`

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/pets` | Lista todos os pets |
| `GET` | `/pets/search/:keyword` | Busca por nome, espécie ou raça (ordenado por nome) |
| `GET` | `/pets/:id` | Busca um pet pelo ID |
| `POST` | `/pets` | Cadastra um novo pet |
| `PUT` | `/pets/:id` | Atualiza um pet |
| `DELETE` | `/pets/:id` | Remove um pet |

**Corpo (JSON) para `POST` e `PUT`:**

```json
{
  "cliente_id": "uuid-do-cliente",
  "nome": "Thor",
  "especie": "Cachorro",
  "raca": "Golden Retriever",
  "idade": 3,
  "activo": true
}
```

---

## Exemplos de uso

**Criar um cliente**

```bash
curl -X POST http://localhost:3000/clientes \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria Silva","email":"maria@email.com","telefone":"(41) 99999-0000","activo":true}'
```

**Cadastrar um pet para esse cliente**

```bash
curl -X POST http://localhost:3000/pets \
  -H "Content-Type: application/json" \
  -d '{"cliente_id":"<ID_DO_CLIENTE>","nome":"Thor","especie":"Cachorro","raca":"Golden Retriever","idade":3,"activo":true}'
```

**Pesquisar pets por palavra-chave**

```bash
curl http://localhost:3000/pets/search/golden
```

**Remover um cliente**

```bash
curl -X DELETE http://localhost:3000/clientes/<ID_DO_CLIENTE>
```

---

## Códigos de resposta

| Código | Significado |
| --- | --- |
| `200` | Requisição realizada com sucesso |
| `201` | Cliente criado com sucesso |
| `400` | Parâmetro obrigatório não informado ou cliente não encontrado |
| `404` | Pet não encontrado ou ID não informado |
| `500` | Erro interno ao processar a requisição |

As mensagens de erro são retornadas em JSON no formato:

```json
{ "message": "Descrição do erro" }
```

---

Licença: ISC