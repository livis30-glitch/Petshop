# Petshop API

API REST para gerenciamento de **clientes**, **pets** e **agendamentos** de um pet shop, desenvolvida com Node.js, Express e TypeScript, utilizando o **Supabase** (PostgreSQL) como banco de dados.

> Trabalho da disciplina de **Desenvolvimento Back-End** — Engenharia de Software, 4P, Turma B (sex). Avaliação Final (2ª parte), baseada no projeto `restaurant-ordering-system` do professor, com a camada de **Services** acrescentada.

---

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Integrantes da equipe](#integrantes-da-equipe)
- [Tecnologias](#tecnologias)
- [Entidades e relacionamento](#entidades-e-relacionamento)
- [Regras de negócio](#regras-de-negócio)
- [Arquitetura e estrutura do projeto](#arquitetura-e-estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e configuração](#instalação-e-configuração)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Executando o projeto](#executando-o-projeto)
- [Testes e cobertura](#testes-e-cobertura)
- [Documentação Swagger](#documentação-swagger)
- [Endpoints da API](#endpoints-da-api)
- [Exemplos de uso](#exemplos-de-uso)
- [Códigos de resposta](#códigos-de-resposta)

---

## Sobre o projeto

A **Petshop API** resolve o problema do controle manual de um pet shop: registrar os clientes, os animais (pets) de cada cliente e os agendamentos de serviços (banho, tosa, consulta etc.), tudo em um banco de dados com regras que evitam registros inconsistentes.

**Objetivo:** oferecer operações completas de cadastro, consulta, atualização e exclusão (CRUD) das três entidades, com pesquisa por palavra-chave, regras de negócio nos services, testes automatizados e documentação interativa.

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
| [Vitest](https://vitest.dev/) | Testes unitários e cobertura |
| [Supertest](https://github.com/ladjs/supertest) | Testes de integração da API |
| [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express) | Documentação interativa (OpenAPI 3) |
| [tsx](https://tsx.is/) | Execução de TypeScript em desenvolvimento |
| [Git](https://git-scm.com/) | Versionamento de código |

---

## Entidades e relacionamento

### Cliente

| Atributo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | Identificador único |
| nome | texto | Nome do cliente (2 a 100 caracteres) |
| email | texto | E-mail válido e único |
| telefone | texto | Telefone com DDD |
| activo | booleano | Indica se o cliente está ativo |

### Pet

| Atributo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | Identificador único |
| cliente_id | UUID | Chave estrangeira para `clientes.id` |
| nome | texto | Nome do pet |
| especie | texto | Espécie (cachorro, gato...) |
| raca | texto | Raça do pet |
| idade | inteiro | Idade do pet (0 a 50) |
| activo | booleano | Indica se o pet está ativo |

### Agendamento

| Atributo | Tipo | Descrição |
| --- | --- | --- |
| id | UUID | Identificador único |
| cliente_id | UUID | Chave estrangeira para `clientes.id` |
| pet_id | UUID | Chave estrangeira para `pets.id` |
| data_hora | data/hora | Data e hora do atendimento (precisa ser futura) |
| servico | texto | Serviço contratado |
| status | texto | `agendado` (padrão), `concluido` ou `cancelado` |
| observacoes | texto | Observações (opcional) |

### Relacionamento

```
Cliente 1 ──── N Pet 1 ──── N Agendamento
```

Um **Cliente** possui vários **Pets**, e um **Pet** possui vários **Agendamentos**. Cada agendamento também guarda o `cliente_id`.

---

## Regras de negócio

- O e-mail do cliente é único e válido; o telefone precisa ter DDD.
- Não é possível excluir um cliente que tenha pets (`409`).
- Um pet só pode ser cadastrado para um cliente existente e ativo.
- Não é possível excluir um pet que tenha agendamentos (`409`).
- Um agendamento exige cliente e pet existentes e ativos, data futura e horário livre (não pode haver outro agendamento no mesmo horário).
- Status: somente um agendamento `agendado` pode virar `concluido` ou `cancelado`.
- Um agendamento `concluido` não pode ser excluído (`409`).

---

## Arquitetura e estrutura do projeto

Fluxo de uma requisição:

```
routes → controllers → services → repositories → models → Supabase
```

| Camada | Responsabilidade |
| --- | --- |
| **routes** | Define as rotas HTTP de cada entidade |
| **controllers** | Recebe a requisição, chama o service e devolve a resposta (`try/catch` + `handleError`) |
| **services** | Regras de negócio que envolvem mais de uma entidade (recebem os repositories no construtor, o que facilita mocks nos testes) |
| **repositories** | Único ponto de acesso ao Supabase; converte erros do banco (chave estrangeira, e-mail repetido) em `ConflictError` |
| **models** | Classes com campos privados; o construtor valida e lança `ValidationError`; `restore()` monta o objeto vindo do banco |

```
Petshop/
├── sql/
│   └── schema.sql                  # Script SQL das 3 tabelas
├── src/
│   ├── config/supabase.ts          # Cliente de conexão com o Supabase
│   ├── controllers/                # ClienteController, PetController, AgendamentoController
│   ├── docs/openapi.ts             # Especificação OpenAPI (Swagger)
│   ├── errors/                     # AppError (+ ValidationError, NotFoundError, ConflictError) e handleError
│   ├── models/                     # Cliente, Pet, Agendamento
│   ├── repositories/               # ClienteRepository, PetRepository, AgendamentoRepository
│   ├── routes/                     # clienteRoutes, petRoutes, agendamentoRoutes
│   ├── services/                   # ClienteService, PetService, AgendamentoService
│   ├── utils/validators.ts         # Funções de validação reutilizadas pelos models
│   ├── app.ts                      # Configuração do Express, rotas e Swagger
│   └── server.ts                   # Inicialização do servidor
├── tests/
│   ├── helpers/fakeSupabase.ts     # Banco falso em memória para os testes de integração
│   ├── integration/                # Testes de integração (Supertest)
│   ├── models/                     # Testes unitários dos models
│   └── services/                   # Testes unitários dos services (repositories mockados)
├── .env.example                    # Modelo das variáveis de ambiente
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Pré-requisitos

- **Node.js 20.6 ou superior** (o script de desenvolvimento usa a flag `--env-file`)
- **npm**
- Um projeto no [Supabase](https://supabase.com/)

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

3. **Configure as variáveis de ambiente:** copie `.env.example` para `.env` e preencha com as credenciais do seu projeto Supabase.

```bash
copy .env.example .env      # Windows
cp .env.example .env        # Linux / macOS
```

4. **Crie as tabelas** no Supabase (veja [Banco de dados](#banco-de-dados)).

---

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `SUPABASE_URL` | URL do projeto no Supabase |
| `SUPABASE_SECRET_KEY` | Chave secreta do Supabase |

Exemplo de `.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sua-chave-secreta
```

> **Nunca** compartilhe nem versione a `SUPABASE_SECRET_KEY`. O `.env` está no `.gitignore`; apenas o `.env.example`, sem credenciais reais, fica no repositório.

---

## Banco de dados

O script completo está em [`sql/schema.sql`](sql/schema.sql). Para criar a estrutura, abra o **SQL Editor** do Supabase, cole o conteúdo do arquivo e execute.

O script cria:

- `clientes`, com índice único no e-mail (sem diferenciar maiúsculas e minúsculas);
- `pets`, com chave estrangeira para `clientes`;
- `agendamentos`, com chaves estrangeiras para `clientes` e `pets`, `status` restrito a `agendado`, `concluido` ou `cancelado` e índice único que impede dois agendamentos não cancelados no mesmo horário.

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

O servidor sobe em **http://localhost:3000**.

### Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor em modo de desenvolvimento, carregando o `.env` |
| `npm run build` | Compila o projeto TypeScript |
| `npm start` | Executa a versão compilada |
| `npm test` | Executa todos os testes |
| `npm run test:watch` | Executa os testes em modo de observação |
| `npm run test:coverage` | Executa os testes e gera o relatório de cobertura |

---

## Testes e cobertura

Os testes usam o **Vitest** e o **Supertest**:

- **Unitários:** models e services, com os repositories mockados (`tests/models/` e `tests/services/`).
- **Integração:** a API é chamada com Supertest sobre um **banco falso em memória** (`tests/helpers/fakeSupabase.ts`), que simula e-mail único e chaves estrangeiras. Por isso os testes não precisam de internet nem de credenciais do Supabase.

```bash
npm test
npm run test:coverage
```

O comando de cobertura exige no mínimo **60%** (statements, branches, functions e lines), configurado em `vitest.config.ts`. O relatório detalhado em HTML fica em `coverage/index.html`.

---

## Documentação Swagger

Com o servidor rodando, a documentação interativa (OpenAPI 3) fica em:

**http://localhost:3000/api-docs**

Nela é possível ver todos os endpoints, os modelos de dados e as respostas possíveis, e testar as requisições pelo navegador.

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
| `GET` | `/clientes/search/:keyword` | Busca por nome, e-mail ou telefone |
| `GET` | `/clientes/:id` | Busca um cliente pelo ID |
| `POST` | `/clientes` | Cadastra um novo cliente |
| `PUT` | `/clientes/:id` | Atualiza um cliente |
| `DELETE` | `/clientes/:id` | Remove um cliente (se não tiver pets) |

Corpo (JSON) para `POST` e `PUT`:

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
| `GET` | `/pets/search/:keyword` | Busca por nome, espécie ou raça |
| `GET` | `/pets/:id` | Busca um pet pelo ID |
| `POST` | `/pets` | Cadastra um novo pet |
| `PUT` | `/pets/:id` | Atualiza um pet |
| `DELETE` | `/pets/:id` | Remove um pet (se não tiver agendamentos) |

Corpo (JSON) para `POST` e `PUT`:

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

### Agendamentos — `/agendamentos`

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/agendamentos` | Lista todos os agendamentos |
| `GET` | `/agendamentos/search/:keyword` | Busca por serviço ou observações |
| `GET` | `/agendamentos/:id` | Busca um agendamento pelo ID |
| `POST` | `/agendamentos` | Cria um novo agendamento |
| `PUT` | `/agendamentos/:id` | Atualiza um agendamento (o status é mantido) |
| `PATCH` | `/agendamentos/:id/status` | Altera o status para `concluido` ou `cancelado` |
| `DELETE` | `/agendamentos/:id` | Remove um agendamento (exceto os concluídos) |

Corpo (JSON) para `POST` e `PUT`:

```json
{
  "cliente_id": "uuid-do-cliente",
  "pet_id": "uuid-do-pet",
  "data_hora": "2026-12-10T14:00:00-03:00",
  "servico": "Banho e tosa",
  "observacoes": "Pet com medo de secador"
}
```

Corpo (JSON) para `PATCH /agendamentos/:id/status`:

```json
{ "status": "concluido" }
```

---

## Exemplos de uso

**Criar um cliente**

```bash
curl -X POST http://localhost:3000/clientes \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria Silva","email":"maria@email.com","telefone":"(41) 99999-0000"}'
```

**Cadastrar um pet para esse cliente**

```bash
curl -X POST http://localhost:3000/pets \
  -H "Content-Type: application/json" \
  -d '{"cliente_id":"<ID_DO_CLIENTE>","nome":"Thor","especie":"Cachorro","raca":"Golden Retriever","idade":3}'
```

**Agendar um serviço**

```bash
curl -X POST http://localhost:3000/agendamentos \
  -H "Content-Type: application/json" \
  -d '{"cliente_id":"<ID_DO_CLIENTE>","pet_id":"<ID_DO_PET>","data_hora":"2026-12-10T14:00:00-03:00","servico":"Banho e tosa"}'
```

**Concluir um agendamento**

```bash
curl -X PATCH http://localhost:3000/agendamentos/<ID_DO_AGENDAMENTO>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"concluido"}'
```

**Pesquisar pets por palavra-chave**

```bash
curl http://localhost:3000/pets/search/golden
```

---

## Códigos de resposta

| Código | Significado |
| --- | --- |
| `200` | Requisição realizada com sucesso |
| `201` | Registro criado com sucesso |
| `400` | Dados inválidos (validação) |
| `404` | Registro não encontrado |
| `409` | Conflito com uma regra de negócio (e-mail repetido, horário ocupado, cliente com pets, pet com agendamentos, agendamento concluído etc.) |
| `500` | Erro interno ao processar a requisição |

As mensagens de erro são retornadas em JSON no formato:

```json
{ "error": "Descrição do erro" }
```

---

Licença: ISC