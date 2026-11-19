
import { describe, it, expect } from "vitest";
import Agendamento from "../../src/models/Agendamento.js";
import { ValidationError } from "../../src/errors/ValidationError.js";

const dadosValidos = {
    cliente_id: "550e8400-e29b-41d4-a716-446655440000",
    pet_id: "550e8400-e29b-41d4-a716-446655440001",
    data_hora: new Date(Date.now() + 86400000).toISOString(),
    servico: "Banho",
    observacoes: "Primeiro agendamento"
};

describe("Model Agendamento", () => {
    it("deve criar um agendamento válido", () => {
        const agendamento = new Agendamento(dadosValidos);

        expect(agendamento.servico).toBe("Banho");
        expect(agendamento.status).toBe("agendado");
        expect(agendamento.clienteId).toBe(dadosValidos.cliente_id);
        expect(agendamento.petId).toBe(dadosValidos.pet_id);
    });

    it("deve remover espaços extras do serviço", () => {
        const agendamento = new Agendamento({
            ...dadosValidos,
            servico: "  Banho  "
        });

        expect(agendamento.servico).toBe("Banho");
    });

    it("deve rejeitar cliente_id inválido", () => {
        expect(() => new Agendamento({
            ...dadosValidos,
            cliente_id: "invalido"
        })).toThrow(ValidationError);
    });

    it("deve rejeitar pet_id inválido", () => {
        expect(() => new Agendamento({
            ...dadosValidos,
            pet_id: "invalido"
        })).toThrow(ValidationError);
    });

    it("deve rejeitar uma data passada", () => {
        expect(() => new Agendamento({
            ...dadosValidos,
            data_hora: "2020-01-01T10:00:00.000Z"
        })).toThrow(ValidationError);
    });

    it("deve rejeitar serviço vazio", () => {
        expect(() => new Agendamento({
            ...dadosValidos,
            servico: " "
        })).toThrow(ValidationError);
    });

    it("deve rejeitar status inválido", () => {
        expect(() => new Agendamento({
            ...dadosValidos,
            status: "invalido" as never
        })).toThrow(ValidationError);
    });

    it("deve permitir alterar o status para concluido", () => {
        const agendamento = new Agendamento(dadosValidos);

        agendamento.alterarStatus("concluido");

        expect(agendamento.status).toBe("concluido");
    });

    it("não deve permitir alterar novamente um agendamento concluído", () => {
        const agendamento = new Agendamento(dadosValidos);

        agendamento.alterarStatus("concluido");

        expect(() => agendamento.alterarStatus("cancelado"))
            .toThrow(ValidationError);
    });

    it("não deve permitir voltar para o status agendado", () => {
        const agendamento = new Agendamento(dadosValidos);

        expect(() => agendamento.alterarStatus("agendado"))
            .toThrow(ValidationError);
    });

    it("deve permitir alterar as observações", () => {
        const agendamento = new Agendamento(dadosValidos);

        agendamento.alterarObservacoes("  Cliente prefere à tarde  ");

        expect(agendamento.observacoes).toBe("Cliente prefere à tarde");
    });
});
