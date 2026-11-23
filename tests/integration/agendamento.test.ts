import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { fakeSupabase } from "../helpers/fakeSupabase.js";

vi.mock("../../src/config/supabase.js", async () => {
    const modulo = await import("../helpers/fakeSupabase.js");
    return { default: modulo.fakeSupabase };
});

const INEXISTENTE = "123e4567-e89b-12d3-a456-426614174000";

// O model exige data futura, então as datas são geradas a partir de hoje
function dataFutura(dias: number = 7, hora: number = 10): string {
    const data = new Date();
    data.setUTCDate(data.getUTCDate() + dias);
    data.setUTCHours(hora, 0, 0, 0);
    return data.toISOString();
}

function criarCliente(activo = true): string {
    const [cliente] = fakeSupabase.seed("clientes", [
        { nome: "Maria Silva", email: "maria@email.com", telefone: "(41) 99999-0000", activo }
    ]);
    return cliente!.id as string;
}

function criarPet(clienteId: string, activo = true): string {
    const [pet] = fakeSupabase.seed("pets", [
        { cliente_id: clienteId, nome: "Rex", especie: "Cachorro", raca: "Labrador", idade: 3, activo }
    ]);
    return pet!.id as string;
}

function dadosAgendamento(clienteId: string, petId: string, extra: Record<string, unknown> = {}) {
    return {
        cliente_id: clienteId,
        pet_id: petId,
        data_hora: dataFutura(),
        servico: "Banho e tosa",
        ...extra
    };
}

function criarAgendamento(clienteId: string, petId: string, extra: Record<string, unknown> = {}): string {
    const [agendamento] = fakeSupabase.seed("agendamentos", [
        { ...dadosAgendamento(clienteId, petId), status: "agendado", observacoes: null, ...extra }
    ]);
    return agendamento!.id as string;
}

function cenario() {
    const clienteId = criarCliente();
    const petId = criarPet(clienteId);
    return { clienteId, petId };
}

describe("API de Agendamentos", () => {
    beforeEach(() => {
        fakeSupabase.reset();
    });

    describe("POST /agendamentos", () => {
        it("cria um agendamento com status agendado e devolve 201", async () => {
            const { clienteId, petId } = cenario();

            const res = await request(app).post("/agendamentos").send(dadosAgendamento(clienteId, petId));

            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                cliente_id: clienteId,
                pet_id: petId,
                servico: "Banho e tosa",
                status: "agendado"
            });
            expect(res.body.id).toBeDefined();
        });

        it("devolve 400 para data no passado", async () => {
            const { clienteId, petId } = cenario();

            const res = await request(app)
                .post("/agendamentos")
                .send(dadosAgendamento(clienteId, petId, { data_hora: "2020-01-01T10:00:00.000Z" }));

            expect(res.status).toBe(400);
        });

        it("devolve 400 para pet_id que não é UUID", async () => {
            const { clienteId } = cenario();

            const res = await request(app)
                .post("/agendamentos")
                .send(dadosAgendamento(clienteId, "abc"));

            expect(res.status).toBe(400);
        });

        it("devolve 400 quando o corpo vem vazio", async () => {
            const res = await request(app).post("/agendamentos").send({});

            expect(res.status).toBe(400);
        });

        it("devolve 404 quando o cliente não existe", async () => {
            const { petId } = cenario();

            const res = await request(app)
                .post("/agendamentos")
                .send(dadosAgendamento(INEXISTENTE, petId));

            expect(res.status).toBe(404);
        });

        it("devolve 404 quando o pet não existe", async () => {
            const { clienteId } = cenario();

            const res = await request(app)
                .post("/agendamentos")
                .send(dadosAgendamento(clienteId, INEXISTENTE));

            expect(res.status).toBe(404);
        });

        it("devolve 409 quando o cliente está inativo", async () => {
            const clienteId = criarCliente(false);
            const petId = criarPet(clienteId);

            const res = await request(app).post("/agendamentos").send(dadosAgendamento(clienteId, petId));

            expect(res.status).toBe(409);
        });

        it("devolve 409 quando o pet está inativo", async () => {
            const clienteId = criarCliente();
            const petId = criarPet(clienteId, false);

            const res = await request(app).post("/agendamentos").send(dadosAgendamento(clienteId, petId));

            expect(res.status).toBe(409);
        });

        it("devolve 409 quando já existe agendamento no mesmo horário", async () => {
            const { clienteId, petId } = cenario();
            const horario = dataFutura(5, 14);
            criarAgendamento(clienteId, petId, { data_hora: horario });

            const res = await request(app)
                .post("/agendamentos")
                .send(dadosAgendamento(clienteId, petId, { data_hora: horario }));

            expect(res.status).toBe(409);
        });
    });

    describe("GET /agendamentos", () => {
        it("devolve lista vazia quando não há agendamentos", async () => {
            const res = await request(app).get("/agendamentos");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("lista os agendamentos cadastrados", async () => {
            const { clienteId, petId } = cenario();
            criarAgendamento(clienteId, petId, { data_hora: dataFutura(3) });
            criarAgendamento(clienteId, petId, { data_hora: dataFutura(4) });

            const res = await request(app).get("/agendamentos");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });
    });

    describe("GET /agendamentos/search/:keyword", () => {
        it("busca por serviço sem confundir 'search' com um id", async () => {
            const { clienteId, petId } = cenario();
            criarAgendamento(clienteId, petId, { servico: "Banho", data_hora: dataFutura(3) });
            criarAgendamento(clienteId, petId, { servico: "Consulta", data_hora: dataFutura(4) });

            const res = await request(app).get("/agendamentos/search/banho");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].servico).toBe("Banho");
        });

        it("devolve lista vazia quando nada combina", async () => {
            const { clienteId, petId } = cenario();
            criarAgendamento(clienteId, petId);

            const res = await request(app).get("/agendamentos/search/zzz");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe("GET /agendamentos/:id", () => {
        it("devolve o agendamento encontrado", async () => {
            const { clienteId, petId } = cenario();
            const id = criarAgendamento(clienteId, petId);

            const res = await request(app).get(`/agendamentos/${id}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(id);
        });

        it("devolve 404 quando não existe", async () => {
            const res = await request(app).get(`/agendamentos/${INEXISTENTE}`);

            expect(res.status).toBe(404);
        });
    });

    describe("PUT /agendamentos/:id", () => {
        it("atualiza o agendamento mantendo o próprio horário", async () => {
            const { clienteId, petId } = cenario();
            const horario = dataFutura(6, 9);
            const id = criarAgendamento(clienteId, petId, { data_hora: horario });

            const res = await request(app)
                .put(`/agendamentos/${id}`)
                .send(dadosAgendamento(clienteId, petId, { data_hora: horario, servico: "Tosa" }));

            expect(res.status).toBe(200);
            expect(res.body.servico).toBe("Tosa");
            expect(res.body.status).toBe("agendado");
        });

        it("devolve 409 ao mudar para o horário de outro agendamento", async () => {
            const { clienteId, petId } = cenario();
            const horarioOcupado = dataFutura(3, 8);
            criarAgendamento(clienteId, petId, { data_hora: horarioOcupado });
            const id = criarAgendamento(clienteId, petId, { data_hora: dataFutura(4, 8) });

            const res = await request(app)
                .put(`/agendamentos/${id}`)
                .send(dadosAgendamento(clienteId, petId, { data_hora: horarioOcupado }));

            expect(res.status).toBe(409);
        });

        it("devolve 400 para data no passado", async () => {
            const { clienteId, petId } = cenario();
            const id = criarAgendamento(clienteId, petId);

            const res = await request(app)
                .put(`/agendamentos/${id}`)
                .send(dadosAgendamento(clienteId, petId, { data_hora: "2020-01-01T10:00:00.000Z" }));

            expect(res.status).toBe(400);
        });

        it("devolve 404 quando o agendamento não existe", async () => {
            const { clienteId, petId } = cenario();

            const res = await request(app)
                .put(`/agendamentos/${INEXISTENTE}`)
                .send(dadosAgendamento(clienteId, petId));

            expect(res.status).toBe(404);
        });
    });

    describe("PATCH /agendamentos/:id/status", () => {
        it("conclui um agendamento", async () => {
            const { clienteId, petId } = cenario();
            const id = criarAgendamento(clienteId, petId);

            const res = await request(app).patch(`/agendamentos/${id}/status`).send({ status: "concluido" });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe("concluido");
        });

        it("cancela um agendamento", async () => {
            const { clienteId, petId } = cenario();
            const id = criarAgendamento(clienteId, petId);

            const res = await request(app).patch(`/agendamentos/${id}/status`).send({ status: "cancelado" });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe("cancelado");
        });

        it("devolve 400 ao alterar um agendamento que já foi concluído", async () => {
            const { clienteId, petId } = cenario();
            const id = criarAgendamento(clienteId, petId, { status: "concluido" });

            const res = await request(app).patch(`/agendamentos/${id}/status`).send({ status: "cancelado" });

            expect(res.status).toBe(400);
        });

        it("devolve 400 ao tentar voltar para agendado", async () => {
            const { clienteId, petId } = cenario();
            const id = criarAgendamento(clienteId, petId);

            const res = await request(app).patch(`/agendamentos/${id}/status`).send({ status: "agendado" });

            expect(res.status).toBe(400);
        });

        it("devolve 400 para status inválido", async () => {
            const { clienteId, petId } = cenario();
            const id = criarAgendamento(clienteId, petId);

            const res = await request(app).patch(`/agendamentos/${id}/status`).send({ status: "xyz" });

            expect(res.status).toBe(400);
        });

        it("devolve 404 quando o agendamento não existe", async () => {
            const res = await request(app)
                .patch(`/agendamentos/${INEXISTENTE}/status`)
                .send({ status: "concluido" });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /agendamentos/:id", () => {
        it("exclui um agendamento com status agendado", async () => {
            const { clienteId, petId } = cenario();
            const id = criarAgendamento(clienteId, petId);

            const res = await request(app).delete(`/agendamentos/${id}`);
            const depois = await request(app).get(`/agendamentos/${id}`);

            expect(res.status).toBe(200);
            expect(depois.status).toBe(404);
        });

        it("devolve 409 ao excluir um agendamento concluído", async () => {
            const { clienteId, petId } = cenario();
            const id = criarAgendamento(clienteId, petId, { status: "concluido" });

            const res = await request(app).delete(`/agendamentos/${id}`);

            expect(res.status).toBe(409);
        });

        it("devolve 404 quando o agendamento não existe", async () => {
            const res = await request(app).delete(`/agendamentos/${INEXISTENTE}`);

            expect(res.status).toBe(404);
        });
    });
});