
import { describe, it, expect, vi, beforeEach } from "vitest";
import AgendamentoService from "../../src/services/AgendamentoService.js";
import Agendamento from "../../src/models/Agendamento.js";
import { NotFoundError, ConflictError } from "../../src/errors/AppError.js";

describe("AgendamentoService", () => {
    let service: AgendamentoService;

    const cliente = { activo: true };
    const pet = { activo: true };

    const dadosValidos = {
        cliente_id: "550e8400-e29b-41d4-a716-446655440000",
        pet_id: "550e8400-e29b-41d4-a716-446655440001",
        data_hora: new Date(Date.now() + 86400000).toISOString(),
        servico: "Banho",
        observacoes: "Primeiro agendamento"
    };

    let agendamentoRepository: any;
    let clienteRepository: any;
    let petRepository: any;

    beforeEach(() => {
        agendamentoRepository = {
            findAll: vi.fn().mockResolvedValue([]),
            findById: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            searchByKeyword: vi.fn()
        };

        clienteRepository = {
            findById: vi.fn().mockResolvedValue(cliente)
        };

        petRepository = {
            findById: vi.fn().mockResolvedValue(pet)
        };

        service = new AgendamentoService(
            agendamentoRepository,
            clienteRepository,
            petRepository
        );
    });

    it("deve listar os agendamentos", async () => {
        agendamentoRepository.findAll.mockResolvedValue([]);

        const resultado = await service.listar();

        expect(resultado).toEqual([]);
        expect(agendamentoRepository.findAll).toHaveBeenCalled();
    });

    it("deve buscar agendamentos por palavra", async () => {
        agendamentoRepository.searchByKeyword.mockResolvedValue([]);

        const resultado = await service.buscarPorPalavra("Banho");

        expect(resultado).toEqual([]);
        expect(agendamentoRepository.searchByKeyword).toHaveBeenCalledWith("Banho");
    });

    it("deve buscar agendamento por ID", async () => {
        const agendamento = new Agendamento(dadosValidos);
        agendamentoRepository.findById.mockResolvedValue(agendamento);

        const resultado = await service.buscarPorId("1");

        expect(resultado).toBe(agendamento);
    });

    it("deve lançar erro quando o agendamento não for encontrado", async () => {
        agendamentoRepository.findById.mockResolvedValue(null);

        await expect(service.buscarPorId("1")).rejects.toThrow(NotFoundError);
    });

    it("deve criar um agendamento válido", async () => {
        const agendamento = new Agendamento(dadosValidos);
        agendamentoRepository.create.mockResolvedValue(agendamento);

        const resultado = await service.criar(dadosValidos);

        expect(resultado).toBe(agendamento);
        expect(agendamentoRepository.create).toHaveBeenCalled();
    });

    it("não deve criar agendamento para cliente inexistente", async () => {
        clienteRepository.findById.mockResolvedValue(null);

        await expect(service.criar(dadosValidos)).rejects.toThrow(NotFoundError);
    });

    it("não deve criar agendamento para cliente inativo", async () => {
        clienteRepository.findById.mockResolvedValue({ activo: false });

        await expect(service.criar(dadosValidos)).rejects.toThrow(ConflictError);
    });

    it("não deve criar agendamento para pet inexistente", async () => {
        petRepository.findById.mockResolvedValue(null);

        await expect(service.criar(dadosValidos)).rejects.toThrow(NotFoundError);
    });

    it("não deve criar agendamento para pet inativo", async () => {
        petRepository.findById.mockResolvedValue({ activo: false });

        await expect(service.criar(dadosValidos)).rejects.toThrow(ConflictError);
    });

    it("não deve criar agendamento em horário ocupado", async () => {
       const existente = new Agendamento({
    ...dadosValidos,
    id: "550e8400-e29b-41d4-a716-446655440002"
});
        agendamentoRepository.findAll.mockResolvedValue([existente]);

        await expect(service.criar(dadosValidos)).rejects.toThrow(ConflictError);
    });

    it("deve alterar o status do agendamento", async () => {
        const agendamento = new Agendamento(dadosValidos);
        agendamentoRepository.findById.mockResolvedValue(agendamento);
        agendamentoRepository.update.mockImplementation(
            async (_id: string, atualizado: Agendamento) => atualizado
        );

        const resultado = await service.alterarStatus("1", "concluido");

        expect(resultado.status).toBe("concluido");
    });

    it("não deve excluir um agendamento concluído", async () => {
        const agendamento = new Agendamento(dadosValidos);
        agendamento.alterarStatus("concluido");
        agendamentoRepository.findById.mockResolvedValue(agendamento);

        await expect(service.remover("1")).rejects.toThrow(ConflictError);
    });
});
vi.mock("../../src/config/supabase.js", () => ({
    default: {}
}));
