import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { fakeSupabase } from "../helpers/fakeSupabase.js";

vi.mock("../../src/config/supabase.js", async () => {
    const modulo = await import("../helpers/fakeSupabase.js");
    return { default: modulo.fakeSupabase };
});

const INEXISTENTE = "123e4567-e89b-12d3-a456-426614174000";

function criarCliente(activo = true): string {
    const [cliente] = fakeSupabase.seed("clientes", [
        { nome: "Maria Silva", email: "maria@email.com", telefone: "(41) 99999-0000", activo }
    ]);
    return cliente!.id as string;
}

function dadosPet(clienteId: string, extra: Record<string, unknown> = {}) {
    return { cliente_id: clienteId, nome: "Rex", especie: "Cachorro", raca: "Labrador", idade: 3, ...extra };
}

function criarPet(clienteId: string, extra: Record<string, unknown> = {}): string {
    const [pet] = fakeSupabase.seed("pets", [{ ...dadosPet(clienteId, extra), activo: true }]);
    return pet!.id as string;
}

describe("API de Pets", () => {
    beforeEach(() => {
        fakeSupabase.reset();
    });

    describe("POST /pets", () => {
        it("cria um pet para um cliente ativo e devolve 201", async () => {
            const clienteId = criarCliente();

            const res = await request(app).post("/pets").send(dadosPet(clienteId));

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({ nome: "Rex", cliente_id: clienteId, activo: true });
            expect(res.body.id).toBeDefined();
        });

        it("devolve 404 quando o cliente não existe", async () => {
            const res = await request(app).post("/pets").send(dadosPet(INEXISTENTE));

            expect(res.status).toBe(404);
        });

        it("devolve 409 quando o cliente está inativo", async () => {
            const clienteId = criarCliente(false);

            const res = await request(app).post("/pets").send(dadosPet(clienteId));

            expect(res.status).toBe(409);
        });

        it("devolve 400 para idade inválida", async () => {
            const clienteId = criarCliente();

            const res = await request(app).post("/pets").send(dadosPet(clienteId, { idade: -1 }));

            expect(res.status).toBe(400);
        });

        it("devolve 400 para cliente_id que não é UUID", async () => {
            const res = await request(app).post("/pets").send(dadosPet("abc"));

            expect(res.status).toBe(400);
        });

        it("devolve 400 quando o corpo vem vazio", async () => {
            const res = await request(app).post("/pets").send({});

            expect(res.status).toBe(400);
        });
    });

    describe("GET /pets", () => {
        it("devolve lista vazia quando não há pets", async () => {
            const res = await request(app).get("/pets");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("lista os pets cadastrados", async () => {
            const clienteId = criarCliente();
            criarPet(clienteId);
            criarPet(clienteId, { nome: "Mia", especie: "Gato", raca: "Siamês" });

            const res = await request(app).get("/pets");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });
    });

    describe("GET /pets/search/:keyword", () => {
        it("busca por nome, espécie ou raça", async () => {
            const clienteId = criarCliente();
            criarPet(clienteId);
            criarPet(clienteId, { nome: "Mia", especie: "Gato", raca: "Siamês" });

            const porNome = await request(app).get("/pets/search/rex");
            const porEspecie = await request(app).get("/pets/search/gato");

            expect(porNome.status).toBe(200);
            expect(porNome.body).toHaveLength(1);
            expect(porNome.body[0].nome).toBe("Rex");
            expect(porEspecie.body).toHaveLength(1);
            expect(porEspecie.body[0].nome).toBe("Mia");
        });
    });

    describe("GET /pets/:id", () => {
        it("devolve o pet encontrado", async () => {
            const clienteId = criarCliente();
            const id = criarPet(clienteId);

            const res = await request(app).get(`/pets/${id}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(id);
        });

        it("devolve 404 quando não existe", async () => {
            const res = await request(app).get(`/pets/${INEXISTENTE}`);

            expect(res.status).toBe(404);
        });
    });

    describe("PUT /pets/:id", () => {
        it("atualiza o pet", async () => {
            const clienteId = criarCliente();
            const id = criarPet(clienteId);

            const res = await request(app)
                .put(`/pets/${id}`)
                .send(dadosPet(clienteId, { nome: "Thor", idade: 4 }));

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ nome: "Thor", idade: 4 });
        });

        it("devolve 400 para dados inválidos", async () => {
            const clienteId = criarCliente();
            const id = criarPet(clienteId);

            const res = await request(app)
                .put(`/pets/${id}`)
                .send(dadosPet(clienteId, { nome: "" }));

            expect(res.status).toBe(400);
        });

        it("devolve 404 quando o pet não existe", async () => {
            const clienteId = criarCliente();

            const res = await request(app).put(`/pets/${INEXISTENTE}`).send(dadosPet(clienteId));

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /pets/:id", () => {
        it("exclui um pet sem agendamentos", async () => {
            const clienteId = criarCliente();
            const id = criarPet(clienteId);

            const res = await request(app).delete(`/pets/${id}`);
            const depois = await request(app).get(`/pets/${id}`);

            expect(res.status).toBe(200);
            expect(depois.status).toBe(404);
        });

        it("devolve 409 quando o pet tem agendamentos", async () => {
            const clienteId = criarCliente();
            const id = criarPet(clienteId);
            fakeSupabase.seed("agendamentos", [{ pet_id: id, cliente_id: clienteId }]);

            const res = await request(app).delete(`/pets/${id}`);

            expect(res.status).toBe(409);
        });

        it("devolve 404 quando o pet não existe", async () => {
            const res = await request(app).delete(`/pets/${INEXISTENTE}`);

            expect(res.status).toBe(404);
        });
    });
});