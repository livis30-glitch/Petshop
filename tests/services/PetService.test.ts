import { describe, it, expect, vi, beforeEach } from "vitest";
import PetService from "../../src/services/PetService.js";
import Pet from "../../src/models/Pet.js";
import Cliente from "../../src/models/Cliente.js";
import type PetRepository from "../../src/repositories/PetRepository.js";
import type ClienteRepository from "../../src/repositories/ClienteRepository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../src/errors/AppError.js";

const CLIENTE_ID = "123e4567-e89b-12d3-a456-426614174000";
const OUTRO_CLIENTE_ID = "223e4567-e89b-12d3-a456-426614174001";

const dados = {
    cliente_id: CLIENTE_ID,
    nome: "Rex",
    especie: "Cachorro",
    raca: "Labrador",
    idade: 3
};

function criarCliente(activo = true): Cliente {
    return new Cliente({
        id: CLIENTE_ID,
        nome: "Maria Silva",
        email: "maria@email.com",
        telefone: "(41) 99999-0000",
        activo
    });
}

function criarPet(): Pet {
    return new Pet({ ...dados, id: "pet-1" });
}

describe("PetService", () => {
    const petRepo = {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        searchByKeyword: vi.fn()
    };
    const clienteRepo = {
        findById: vi.fn()
    };
    let service: PetService;

    beforeEach(() => {
        vi.resetAllMocks();
        service = new PetService(
            petRepo as unknown as PetRepository,
            clienteRepo as unknown as ClienteRepository
        );
    });

    describe("listar e buscar", () => {
        it("listar devolve os pets do repository", async () => {
            const lista = [criarPet()];
            petRepo.findAll.mockResolvedValue(lista);

            expect(await service.listar()).toBe(lista);
        });

        it("buscarPorPalavra repassa a palavra ao repository", async () => {
            petRepo.searchByKeyword.mockResolvedValue([]);

            await service.buscarPorPalavra("rex");

            expect(petRepo.searchByKeyword).toHaveBeenCalledWith("rex");
        });

        it("buscarPorId devolve o pet encontrado", async () => {
            const pet = criarPet();
            petRepo.findById.mockResolvedValue(pet);

            expect(await service.buscarPorId("pet-1")).toBe(pet);
        });

        it("buscarPorId lança NotFoundError quando não existe", async () => {
            petRepo.findById.mockResolvedValue(null);

            await expect(service.buscarPorId("x")).rejects.toThrow(NotFoundError);
        });
    });

    describe("criar", () => {
        it("cria o pet para um cliente ativo", async () => {
            clienteRepo.findById.mockResolvedValue(criarCliente());
            petRepo.create.mockImplementation(async (p: Pet) => p);

            const criado = await service.criar(dados);

            expect(criado.nome).toBe("Rex");
            expect(petRepo.create).toHaveBeenCalledTimes(1);
        });

        it("lança NotFoundError quando o cliente não existe", async () => {
            clienteRepo.findById.mockResolvedValue(null);

            await expect(service.criar(dados)).rejects.toThrow(NotFoundError);
            expect(petRepo.create).not.toHaveBeenCalled();
        });

        it("lança ConflictError quando o cliente está inativo", async () => {
            clienteRepo.findById.mockResolvedValue(criarCliente(false));

            await expect(service.criar(dados)).rejects.toThrow(ConflictError);
            expect(petRepo.create).not.toHaveBeenCalled();
        });

        it("lança ValidationError para dados inválidos sem consultar o cliente", async () => {
            await expect(service.criar({ ...dados, idade: -1 })).rejects.toThrow(ValidationError);
            expect(clienteRepo.findById).not.toHaveBeenCalled();
        });
    });

    describe("atualizar", () => {
        it("atualiza sem consultar o cliente quando o dono não muda", async () => {
            petRepo.findById.mockResolvedValue(criarPet());
            petRepo.update.mockImplementation(async (_id: string, p: Pet) => p);

            const atualizado = await service.atualizar("pet-1", { ...dados, nome: "Thor" });

            expect(atualizado.nome).toBe("Thor");
            expect(clienteRepo.findById).not.toHaveBeenCalled();
        });

        it("valida o novo cliente ao trocar de dono", async () => {
            petRepo.findById.mockResolvedValue(criarPet());
            clienteRepo.findById.mockResolvedValue(criarCliente());
            petRepo.update.mockImplementation(async (_id: string, p: Pet) => p);

            const atualizado = await service.atualizar("pet-1", { ...dados, cliente_id: OUTRO_CLIENTE_ID });

            expect(clienteRepo.findById).toHaveBeenCalledWith(OUTRO_CLIENTE_ID);
            expect(atualizado.clienteId).toBe(OUTRO_CLIENTE_ID);
        });

        it("lança ConflictError ao passar o pet para um cliente inativo", async () => {
            petRepo.findById.mockResolvedValue(criarPet());
            clienteRepo.findById.mockResolvedValue(criarCliente(false));

            await expect(
                service.atualizar("pet-1", { ...dados, cliente_id: OUTRO_CLIENTE_ID })
            ).rejects.toThrow(ConflictError);
            expect(petRepo.update).not.toHaveBeenCalled();
        });

        it("lança NotFoundError quando o pet não existe", async () => {
            petRepo.findById.mockResolvedValue(null);

            await expect(service.atualizar("x", dados)).rejects.toThrow(NotFoundError);
        });

        it("lança NotFoundError quando o update não encontra o registro", async () => {
            petRepo.findById.mockResolvedValue(criarPet());
            petRepo.update.mockResolvedValue(null);

            await expect(service.atualizar("pet-1", dados)).rejects.toThrow(NotFoundError);
        });

        it("lança ValidationError para dados inválidos", async () => {
            petRepo.findById.mockResolvedValue(criarPet());

            await expect(
                service.atualizar("pet-1", { ...dados, nome: "" })
            ).rejects.toThrow(ValidationError);
        });
    });

    describe("remover", () => {
        it("remove um pet existente", async () => {
            petRepo.findById.mockResolvedValue(criarPet());
            petRepo.remove.mockResolvedValue(true);

            await service.remover("pet-1");

            expect(petRepo.remove).toHaveBeenCalledWith("pet-1");
        });

        it("lança NotFoundError quando o pet não existe", async () => {
            petRepo.findById.mockResolvedValue(null);

            await expect(service.remover("x")).rejects.toThrow(NotFoundError);
            expect(petRepo.remove).not.toHaveBeenCalled();
        });

        it("repassa o ConflictError quando o pet tem agendamentos", async () => {
            petRepo.findById.mockResolvedValue(criarPet());
            petRepo.remove.mockRejectedValue(new ConflictError("Pet possui agendamentos."));

            await expect(service.remover("pet-1")).rejects.toThrow(ConflictError);
        });
    });
});