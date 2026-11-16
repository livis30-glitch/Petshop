import Pet, { type PetProps } from "../models/Pet.js";
import PetRepository from "../repositories/PetRepository.js";
import ClienteRepository from "../repositories/ClienteRepository.js";
import { ConflictError, NotFoundError } from "../errors/AppError.js";

export type PetDados = Omit<PetProps, "id">;

export default class PetService {
    private petRepository: PetRepository;
    private clienteRepository: ClienteRepository;

    constructor(
        petRepository: PetRepository = new PetRepository(),
        clienteRepository: ClienteRepository = new ClienteRepository()
    ) {
        this.petRepository = petRepository;
        this.clienteRepository = clienteRepository;
    }

    async listar(): Promise<Pet[]> {
        return this.petRepository.findAll();
    }

    async buscarPorPalavra(keyword: string): Promise<Pet[]> {
        return this.petRepository.searchByKeyword(keyword);
    }

    async buscarPorId(id: string): Promise<Pet> {
        const pet = await this.petRepository.findById(id);
        if (!pet) {
            throw new NotFoundError("Pet não encontrado.");
        }
        return pet;
    }

    async criar(dados: PetDados): Promise<Pet> {
        const pet = new Pet(dados);
        await this.garantirClienteAtivo(pet.clienteId);
        return this.petRepository.create(pet);
    }

    async atualizar(id: string, dados: PetDados): Promise<Pet> {
        const existente = await this.buscarPorId(id);
        const pet = new Pet({
            ...dados,
            id,
            cliente_id: dados.cliente_id ?? existente.clienteId,
            activo: dados.activo ?? existente.activo
        });

        if (pet.clienteId !== existente.clienteId) {
            await this.garantirClienteAtivo(pet.clienteId);
        }

        const atualizado = await this.petRepository.update(id, pet);
        if (!atualizado) {
            throw new NotFoundError("Pet não encontrado.");
        }
        return atualizado;
    }

    async remover(id: string): Promise<void> {
        await this.buscarPorId(id);
        await this.petRepository.remove(id);
    }

    private async garantirClienteAtivo(clienteId: string): Promise<void> {
        const cliente = await this.clienteRepository.findById(clienteId);
        if (!cliente) {
            throw new NotFoundError("Cliente não encontrado.");
        }
        if (!cliente.activo) {
            throw new ConflictError("Não é possível cadastrar pet para um cliente inativo.");
        }
    }
}