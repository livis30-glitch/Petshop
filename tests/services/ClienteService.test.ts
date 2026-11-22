import { describe, it, expect, vi, beforeEach } from "vitest";
import ClienteService from "../../src/services/ClienteService.js";
import Cliente from "../../src/models/Cliente.js";
import Pet from "../../src/models/Pet.js";
import type ClienteRepository from "../../src/repositories/ClienteRepository.js";
import type PetRepository from "../../src/repositories/PetRepository.js";
import { ConflictError, NotFoundError, ValidationError } from "../../src/errors/AppError.js";

const CLIENTE_ID = "123e4567-e89b-12d3-a456-426614174000";

const dados = {
    nome: "Maria Silva",
    email: "maria@email.com",
    telefone: "(41) 99999-0000"
};

function criarCliente(extra: { email?: string; activo?: boolean } = {}): Cliente {
    return new Cliente({ ...dados, id: CLIENTE_ID, ...extra });
}

function criarPet(): Pet {
    return new Pet({
        id: "pet-1",
        cliente_id: CLIENTE_ID,
        nome: "Rex",
        especie: "Cachorro",
        raca: "Labrador",
        idade: 3
    });
}

describe("ClienteService", () => {
    const clienteRepo = {
        findAll: vi.fn(),
        findById: vi.fn(),
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        searchByKeyword: vi.fn()
    };
    const petRepo = {
        findByClienteId: vi.fn()
    };
    let service: ClienteService;

    beforeEach(() => {
        vi.resetAllMocks();
        service = new ClienteService(
            clienteRepo as unknown as ClienteRepository,
            petRepo as unknown as PetRepository
        );
    });

    describe("listar e buscar", () => {
        it("listar devolve os clientes do repository", async () => {
            const lista = [criarCliente()];
            clienteRepo.findAll.mockResolvedValue(lista);

            expect(await service.listar()).toBe(lista);
        });

        it("buscarPorPalavra repassa a palavra ao repository", async () => {
            clienteRepo.searchByKeyword.mockResolvedValue([]);

            await service.buscarPorPalavra("maria");

            expect(clienteRepo.searchByKeyword).toHaveBeenCalledWith("maria");
        });

        it("buscarPorId devolve o cliente encontrado", async () => {
            const cliente = criarCliente();
            clienteRepo.findById.mockResolvedValue(cliente);

            expect(await service.buscarPorId(CLIENTE_ID)).toBe(cliente);
        });

        it("buscarPorId lança NotFoundError quando não existe", async () => {
            clienteRepo.findById.mockResolvedValue(null);

            await expect(service.buscarPorId("x")).rejects.toThrow(NotFoundError);
        });
    });

    describe("criar", () => {
        it("cria o cliente quando o e-mail está livre", async () => {
            clienteRepo.findByEmail.mockResolvedValue(null);
            clienteRepo.create.mockImplementation(async (c: Cliente) => c);

            const criado = await service.criar(dados);

            expect(criado.email).toBe("maria@email.com");
            expect(clienteRepo.create).toHaveBeenCalledTimes(1);
        });

        it("lança ConflictError quando o e-mail já existe", async () => {
            clienteRepo.findByEmail.mockResolvedValue(criarCliente());

            await expect(service.criar(dados)).rejects.toThrow(ConflictError);
            expect(clienteRepo.create).not.toHaveBeenCalled();
        });

        it("lança ValidationError para dados inválidos sem consultar o banco", async () => {
            await expect(service.criar({ ...dados, email: "invalido" })).rejects.toThrow(ValidationError);
            expect(clienteRepo.findByEmail).not.toHaveBeenCalled();
            expect(clienteRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("atualizar", () => {
        it("atualiza mantendo o e-mail sem checar duplicidade", async () => {
            clienteRepo.findById.mockResolvedValue(criarCliente());
            clienteRepo.update.mockImplementation(async (_id: string, c: Cliente) => c);

            const atualizado = await service.atualizar(CLIENTE_ID, { ...dados, nome: "Maria Souza" });

            expect(atualizado.nome).toBe("Maria Souza");
            expect(clienteRepo.findByEmail).not.toHaveBeenCalled();
        });

        it("mantém o status activo atual quando não é informado", async () => {
            clienteRepo.findById.mockResolvedValue(criarCliente({ activo: false }));
            clienteRepo.update.mockImplementation(async (_id: string, c: Cliente) => c);

            const atualizado = await service.atualizar(CLIENTE_ID, dados);

            expect(atualizado.activo).toBe(false);
        });

        it("lança ConflictError ao trocar para um e-mail de outro cliente", async () => {
            clienteRepo.findById.mockResolvedValue(criarCliente());
            clienteRepo.findByEmail.mockResolvedValue(criarCliente({ email: "outra@email.com" }));

            await expect(
                service.atualizar(CLIENTE_ID, { ...dados, email: "outra@email.com" })
            ).rejects.toThrow(ConflictError);
            expect(clienteRepo.update).not.toHaveBeenCalled();
        });

        it("lança NotFoundError quando o cliente não existe", async () => {
            clienteRepo.findById.mockResolvedValue(null);

            await expect(service.atualizar("x", dados)).rejects.toThrow(NotFoundError);
        });

        it("lança NotFoundError quando o update não encontra o registro", async () => {
            clienteRepo.findById.mockResolvedValue(criarCliente());
            clienteRepo.update.mockResolvedValue(null);

            await expect(service.atualizar(CLIENTE_ID, dados)).rejects.toThrow(NotFoundError);
        });

        it("lança ValidationError para dados inválidos", async () => {
            clienteRepo.findById.mockResolvedValue(criarCliente());

            await expect(
                service.atualizar(CLIENTE_ID, { ...dados, telefone: "123" })
            ).rejects.toThrow(ValidationError);
        });
    });

    describe("remover", () => {
        it("remove um cliente sem pets", async () => {
            clienteRepo.findById.mockResolvedValue(criarCliente());
            petRepo.findByClienteId.mockResolvedValue([]);
            clienteRepo.remove.mockResolvedValue(true);

            await service.remover(CLIENTE_ID);

            expect(clienteRepo.remove).toHaveBeenCalledWith(CLIENTE_ID);
        });

        it("lança ConflictError quando o cliente tem pets", async () => {
            clienteRepo.findById.mockResolvedValue(criarCliente());
            petRepo.findByClienteId.mockResolvedValue([criarPet()]);

            await expect(service.remover(CLIENTE_ID)).rejects.toThrow(ConflictError);
            expect(clienteRepo.remove).not.toHaveBeenCalled();
        });

        it("lança NotFoundError quando o cliente não existe", async () => {
            clienteRepo.findById.mockResolvedValue(null);

            await expect(service.remover("x")).rejects.toThrow(NotFoundError);
            expect(clienteRepo.remove).not.toHaveBeenCalled();
        });
    });
});