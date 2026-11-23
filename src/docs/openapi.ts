const ref = (nome: string) => ({ $ref: `#/components/schemas/${nome}` });

const conteudoJson = (schema: object) => ({ "application/json": { schema } });

const erro = (descricao: string) => ({
    description: descricao,
    content: conteudoJson(ref("Erro"))
});

const parametroId = {
    name: "id",
    in: "path",
    required: true,
    description: "ID (UUID) do registro",
    schema: { type: "string", format: "uuid" }
};

const parametroKeyword = {
    name: "keyword",
    in: "path",
    required: true,
    description: "Palavra-chave da busca",
    schema: { type: "string" }
};

interface OpcoesCrud {
    base: string;
    tag: string;
    schema: string;
    entrada: string;
    nome: string;
    plural: string;
    busca: string;
    respostasCriar: Record<string, object>;
    respostasAtualizar: Record<string, object>;
    respostasExcluir: Record<string, object>;
}

function caminhosCrud(o: OpcoesCrud) {
    const minusculo = o.nome.toLowerCase();

    return {
        [o.base]: {
            get: {
                tags: [o.tag],
                summary: `Lista todos os ${o.plural}`,
                responses: {
                    "200": {
                        description: `Lista de ${o.plural}`,
                        content: conteudoJson({ type: "array", items: ref(o.schema) })
                    }
                }
            },
            post: {
                tags: [o.tag],
                summary: `Cadastra um ${minusculo}`,
                requestBody: { required: true, content: conteudoJson(ref(o.entrada)) },
                responses: {
                    "201": { description: `${o.nome} criado`, content: conteudoJson(ref(o.schema)) },
                    "400": erro("Dados inválidos"),
                    ...o.respostasCriar
                }
            }
        },
        [`${o.base}/search/{keyword}`]: {
            get: {
                tags: [o.tag],
                summary: `Busca ${o.plural} por palavra-chave`,
                description: o.busca,
                parameters: [parametroKeyword],
                responses: {
                    "200": {
                        description: `${o.plural} encontrados (lista vazia se nada combinar)`,
                        content: conteudoJson({ type: "array", items: ref(o.schema) })
                    }
                }
            }
        },
        [`${o.base}/{id}`]: {
            get: {
                tags: [o.tag],
                summary: `Busca um ${minusculo} pelo ID`,
                parameters: [parametroId],
                responses: {
                    "200": { description: `${o.nome} encontrado`, content: conteudoJson(ref(o.schema)) },
                    "404": erro(`${o.nome} não encontrado`)
                }
            },
            put: {
                tags: [o.tag],
                summary: `Atualiza um ${minusculo}`,
                parameters: [parametroId],
                requestBody: { required: true, content: conteudoJson(ref(o.entrada)) },
                responses: {
                    "200": { description: `${o.nome} atualizado`, content: conteudoJson(ref(o.schema)) },
                    "400": erro("Dados inválidos"),
                    "404": erro(`${o.nome} não encontrado`),
                    ...o.respostasAtualizar
                }
            },
            delete: {
                tags: [o.tag],
                summary: `Remove um ${minusculo}`,
                parameters: [parametroId],
                responses: {
                    "200": { description: `${o.nome} excluído`, content: conteudoJson(ref("Mensagem")) },
                    "404": erro(`${o.nome} não encontrado`),
                    ...o.respostasExcluir
                }
            }
        }
    };
}

export const openapi = {
    openapi: "3.0.3",
    info: {
        title: "Petshop API",
        version: "1.0.0",
        description:
            "API REST para gerenciamento de clientes, pets e agendamentos de um pet shop. " +
            "Relacionamento: Cliente 1:N Pet 1:N Agendamento."
    },
    servers: [{ url: "http://localhost:3000", description: "Servidor local" }],
    tags: [
        { name: "Geral" },
        { name: "Clientes" },
        { name: "Pets" },
        { name: "Agendamentos" }
    ],
    paths: {
        "/": {
            get: {
                tags: ["Geral"],
                summary: "Nome e versão da API",
                responses: {
                    "200": {
                        description: "API no ar",
                        content: conteudoJson({
                            type: "object",
                            properties: {
                                message: { type: "string", example: "API Petshop" },
                                version: { type: "string", example: "1.0.0" }
                            }
                        })
                    }
                }
            }
        },
        ...caminhosCrud({
            base: "/clientes",
            tag: "Clientes",
            schema: "Cliente",
            entrada: "ClienteInput",
            nome: "Cliente",
            plural: "clientes",
            busca: "Busca por nome, e-mail ou telefone.",
            respostasCriar: { "409": erro("E-mail já cadastrado") },
            respostasAtualizar: { "409": erro("E-mail já usado por outro cliente") },
            respostasExcluir: { "409": erro("Cliente possui pets e não pode ser excluído") }
        }),
        ...caminhosCrud({
            base: "/pets",
            tag: "Pets",
            schema: "Pet",
            entrada: "PetInput",
            nome: "Pet",
            plural: "pets",
            busca: "Busca por nome, espécie ou raça.",
            respostasCriar: {
                "404": erro("Cliente não encontrado"),
                "409": erro("Cliente inativo")
            },
            respostasAtualizar: { "409": erro("Novo cliente inativo") },
            respostasExcluir: { "409": erro("Pet possui agendamentos e não pode ser excluído") }
        }),
        ...caminhosCrud({
            base: "/agendamentos",
            tag: "Agendamentos",
            schema: "Agendamento",
            entrada: "AgendamentoInput",
            nome: "Agendamento",
            plural: "agendamentos",
            busca: "Busca por serviço ou observações.",
            respostasCriar: {
                "404": erro("Cliente ou pet não encontrado"),
                "409": erro("Cliente ou pet inativo, ou já existe agendamento no mesmo horário")
            },
            respostasAtualizar: {
                "409": erro("Cliente ou pet inativo, ou horário já ocupado por outro agendamento")
            },
            respostasExcluir: { "409": erro("Agendamento concluído não pode ser excluído") }
        }),
        "/agendamentos/{id}/status": {
            patch: {
                tags: ["Agendamentos"],
                summary: "Altera o status de um agendamento",
                description: "Somente um agendamento com status agendado pode virar concluido ou cancelado.",
                parameters: [parametroId],
                requestBody: { required: true, content: conteudoJson(ref("StatusInput")) },
                responses: {
                    "200": { description: "Status alterado", content: conteudoJson(ref("Agendamento")) },
                    "400": erro("Status inválido ou agendamento já finalizado"),
                    "404": erro("Agendamento não encontrado")
                }
            }
        }
    },
    components: {
        schemas: {
            Cliente: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    nome: { type: "string", example: "Maria Silva" },
                    email: { type: "string", format: "email", example: "maria@email.com" },
                    telefone: { type: "string", example: "(41) 99999-0000" },
                    activo: { type: "boolean", example: true }
                }
            },
            ClienteInput: {
                type: "object",
                required: ["nome", "email", "telefone"],
                properties: {
                    nome: { type: "string", minLength: 2, maxLength: 100, example: "Maria Silva" },
                    email: { type: "string", format: "email", example: "maria@email.com" },
                    telefone: { type: "string", description: "Com DDD", example: "(41) 99999-0000" },
                    activo: { type: "boolean", default: true }
                }
            },
            Pet: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    cliente_id: { type: "string", format: "uuid" },
                    nome: { type: "string", example: "Thor" },
                    especie: { type: "string", example: "Cachorro" },
                    raca: { type: "string", example: "Golden Retriever" },
                    idade: { type: "integer", example: 3 },
                    activo: { type: "boolean", example: true }
                }
            },
            PetInput: {
                type: "object",
                required: ["cliente_id", "nome", "especie", "raca", "idade"],
                properties: {
                    cliente_id: { type: "string", format: "uuid" },
                    nome: { type: "string", maxLength: 100, example: "Thor" },
                    especie: { type: "string", minLength: 2, maxLength: 50, example: "Cachorro" },
                    raca: { type: "string", maxLength: 50, example: "Golden Retriever" },
                    idade: { type: "integer", minimum: 0, maximum: 50, example: 3 },
                    activo: { type: "boolean", default: true }
                }
            },
            Agendamento: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    cliente_id: { type: "string", format: "uuid" },
                    pet_id: { type: "string", format: "uuid" },
                    data_hora: { type: "string", format: "date-time", example: "2026-12-10T14:00:00-03:00" },
                    servico: { type: "string", example: "Banho e tosa" },
                    status: { type: "string", enum: ["agendado", "concluido", "cancelado"], example: "agendado" },
                    observacoes: { type: "string", nullable: true, example: "Pet com medo de secador" }
                }
            },
            AgendamentoInput: {
                type: "object",
                required: ["cliente_id", "pet_id", "data_hora", "servico"],
                properties: {
                    cliente_id: { type: "string", format: "uuid" },
                    pet_id: { type: "string", format: "uuid" },
                    data_hora: {
                        type: "string",
                        format: "date-time",
                        description: "Precisa ser uma data futura",
                        example: "2026-12-10T14:00:00-03:00"
                    },
                    servico: { type: "string", example: "Banho e tosa" },
                    observacoes: { type: "string", nullable: true, example: "Pet com medo de secador" }
                }
            },
            StatusInput: {
                type: "object",
                required: ["status"],
                properties: {
                    status: { type: "string", enum: ["concluido", "cancelado"], example: "concluido" }
                }
            },
            Mensagem: {
                type: "object",
                properties: { mensagem: { type: "string", example: "Registro excluído com sucesso." } }
            },
            Erro: {
                type: "object",
                properties: { error: { type: "string", example: "Descrição do erro" } }
            }
        }
    }
};