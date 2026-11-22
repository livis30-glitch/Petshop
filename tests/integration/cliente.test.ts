import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { fakeSupabase } from "../helpers/fakeSupabase.js";

vi.mock("../../src/config/supabase.js", async () => {
    const modulo = await import("../helpers/fakeSupabase.js");
    return { default: modulo.fakeSupabase };
});

const clienteValido = {
    nome: "Maria Silva",
    email: "maria@email.com",
    telefone: "(41) 99999-0000"
};

function criarCliente(dados: Record<string, unknown> = {}): string {
    const [cliente] = fakeSupabase.seed("clientes", [{ ...clienteValido, activo: true, ...dados }]);
    return cliente!.id as string;
}

describe("API de Clientes", () => {
    beforeEach(() => {
        fakeSupabase.reset();
    });

    describe("POST /clientes", () => {
        it("cria um cliente e devolve 201", async () => {
            const res = await request(app).post("/clientes").send(clienteValido);

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({ ...clienteValido, activo: true });
            expect(res.body.id).toBeDefined();
        });

        it("normaliza o e-mail para minúsculas", async () => {
            const res = await request(app)
                .post("/clientes")
                .send({ ...clienteValido, email: "MARIA@Email.com" });

            expect(res.status).toBe(201);
            expect(res.body.email).toBe("maria@email.com");
        });

        it("devolve 400 para e-mail inválido", async () => {
            const res = await request(app)
                .post("/clientes")
                .send({ ...clienteValido, email: "invalido" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it("devolve 400 para telefone sem DDD", async () => {
            const res = await request(app)
                .post("/clientes")
                .send({ ...clienteValido, telefone: "99999-0000" });

            expect(res.status).toBe(400);
        });

        it("devolve 400 quando o corpo vem vazio", async () => {
            const res = await request(app).post("/clientes").send({});

            expect(res.status).toBe(400);
        });

        it("devolve 409 para e-mail já cadastrado", async () => {
            criarCliente();

            const res = await request(app).post("/clientes").send(clienteValido);

            expect(res.status).toBe(409);
            expect(res.body.error).toBeDefined();
        });
    });

    describe("GET /clientes", () => {
        it("devolve lista vazia quando não há clientes", async () => {
            const res = await request(app).get("/clientes");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("lista os clientes cadastrados", async () => {
            criarCliente();
            criarCliente({ nome: "João Souza", email: "joao@email.com" });

            const res = await request(app).get("/clientes");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });
    });

    describe("GET /clientes/search/:keyword", () => {
        it("busca por nome e não confunde 'search' com um id", async () => {
            criarCliente();
            criarCliente({ nome: "João Souza", email: "joao@email.com" });

            const res = await request(app).get("/clientes/search/maria");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].nome).toBe("Maria Silva");
        });

        it("devolve lista vazia quando nada combina", async () => {
            criarCliente();

            const res = await request(app).get("/clientes/search/zzz");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe("GET /clientes/:id", () => {
        it("devolve o cliente encontrado", async () => {
            const id = criarCliente();

            const res = await request(app).get(`/clientes/${id}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(id);
        });

        it("devolve 404 quando não existe", async () => {
            const res = await request(app).get("/clientes/123e4567-e89b-12d3-a456-426614174000");

            expect(res.status).toBe(404);
        });
    });

    describe("PUT /clientes/:id", () => {
        it("atualiza o cliente", async () => {
            const id = criarCliente();

            const res = await request(app)
                .put(`/clientes/${id}`)
                .send({ ...clienteValido, nome: "Maria Souza" });

            expect(res.status).toBe(200);
            expect(res.body.nome).toBe("Maria Souza");
        });

        it("devolve 409 ao usar o e-mail de outro cliente", async () => {
            criarCliente({ email: "joao@email.com" });
            const id = criarCliente();

            const res = await request(app)
                .put(`/clientes/${id}`)
                .send({ ...clienteValido, email: "joao@email.com" });

            expect(res.status).toBe(409);
        });

        it("devolve 400 para dados inválidos", async () => {
            const id = criarCliente();

            const res = await request(app)
                .put(`/clientes/${id}`)
                .send({ ...clienteValido, nome: "A" });

            expect(res.status).toBe(400);
        });

        it("devolve 404 quando o cliente não existe", async () => {
            const res = await request(app)
                .put("/clientes/123e4567-e89b-12d3-a456-426614174000")
                .send(clienteValido);

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /clientes/:id", () => {
        it("exclui um cliente sem pets", async () => {
            const id = criarCliente();

            const res = await request(app).delete(`/clientes/${id}`);
            const depois = await request(app).get(`/clientes/${id}`);

            expect(res.status).toBe(200);
            expect(depois.status).toBe(404);
        });

        it("devolve 409 quando o cliente tem pets", async () => {
            const id = criarCliente();
            fakeSupabase.seed("pets", [
                { cliente_id: id, nome: "Rex", especie: "Cachorro", raca: "Labrador", idade: 3, activo: true }
            ]);

            const res = await request(app).delete(`/clientes/${id}`);

            expect(res.status).toBe(409);
        });

        it("devolve 404 quando o cliente não existe", async () => {
            const res = await request(app).delete("/clientes/123e4567-e89b-12d3-a456-426614174000");

            expect(res.status).toBe(404);
        });
    });
});