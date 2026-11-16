import Cliente, { type ClienteProps } from "../models/Cliente.js";
import ClienteRepository from "../repositories/ClienteRepository.js";
import PetRepository from "../repositories/PetRepository.js";
import { ConflictError, NotFoundError } from "../errors/AppError.js";

export type ClienteDados = Omit<ClienteProps, "id">;

export default class ClienteService {
    private clienteRepository: ClienteRepository;
    private petRepository: PetRepository;

    constructor(
        clienteRepository: ClienteRepository = new ClienteRepository(),
        petRepository: PetRepository = new PetRepository()
    ) {
        this.clienteRepository = clienteRepository;
        this.petRepository = petRepository;
    }

    async listar(): Promise<Cliente[]> {
        return this.clienteRepository.findAll();
    }

    async buscarPorPalavra(keyword: string): Promise<Cliente[]> {
        return this.clienteRepository.searchByKeyword(keyword);
    }

    async buscarPorId(id: string): Promise<Cliente> {
        const cliente = await this.clienteRepository.findById(id);
        if (!cliente) {
            throw new NotFoundError("Cliente não encontrado.");
        }
        return cliente;
    }

    async criar(dados: ClienteDados): Promise<Cliente> {
        const cliente = new Cliente(dados);
        await this.garantirEmailLivre(cliente.email);
        return this.clienteRepository.create(cliente);
    }

    async atualizar(id: string, dados: ClienteDados): Promise<Cliente> {
        const existente = await this.buscarPorId(id);
        const cliente = new Cliente({
            ...dados,
            id,
            activo: dados.activo ?? existente.activo
        });

        if (cliente.email !== existente.email) {
            await this.garantirEmailLivre(cliente.email);
        }

        const atualizado = await this.clienteRepository.update(id, cliente);
        if (!atualizado) {
            throw new NotFoundError("Cliente não encontrado.");
        }
        return atualizado;
    }

    async remover(id: string): Promise<void> {
        await this.buscarPorId(id);

        const pets = await this.petRepository.findByClienteId(id);
        if (pets.length > 0) {
            throw new ConflictError("Não é possível excluir um cliente que possui pets.");
        }

        await this.clienteRepository.remove(id);
    }

    private async garantirEmailLivre(email: string): Promise<void> {
        const existente = await this.clienteRepository.findByEmail(email);
        if (existente) {
            throw new ConflictError("Já existe um cliente com esse e-mail.");
        }
    }
}