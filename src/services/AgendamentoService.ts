
import Agendamento, { type AgendamentoProps, type AgendamentoStatus } from "../models/Agendamento.js";
import AgendamentoRepository from "../repositories/AgendamentoRepository.js";
import ClienteRepository from "../repositories/ClienteRepository.js";
import PetRepository from "../repositories/PetRepository.js";
import { ConflictError, NotFoundError } from "../errors/AppError.js";

export type AgendamentoDados = Omit<AgendamentoProps, "id">;

export default class AgendamentoService {
    private agendamentoRepository: AgendamentoRepository;
    private clienteRepository: ClienteRepository;
    private petRepository: PetRepository;

    constructor(
        agendamentoRepository: AgendamentoRepository = new AgendamentoRepository(),
        clienteRepository: ClienteRepository = new ClienteRepository(),
        petRepository: PetRepository = new PetRepository()
    ) {
        this.agendamentoRepository = agendamentoRepository;
        this.clienteRepository = clienteRepository;
        this.petRepository = petRepository;
    }

    async listar(): Promise<Agendamento[]> {
        return this.agendamentoRepository.findAll();
    }

    async buscarPorPalavra(keyword: string): Promise<Agendamento[]> {
        return this.agendamentoRepository.searchByKeyword(keyword);
    }

    async buscarPorId(id: string): Promise<Agendamento> {
        const agendamento = await this.agendamentoRepository.findById(id);
        if (!agendamento) {
            throw new NotFoundError("Agendamento não encontrado.");
        }
        return agendamento;
    }

    async criar(dados: AgendamentoDados): Promise<Agendamento> {
        const agendamento = new Agendamento(dados);

        await this.garantirClienteAtivo(agendamento.clienteId);
        await this.garantirPetAtivo(agendamento.petId);
        await this.garantirHorarioLivre(agendamento.dataHora);

        return this.agendamentoRepository.create(agendamento);
    }

    async atualizar(id: string, dados: AgendamentoDados): Promise<Agendamento> {
        const existente = await this.buscarPorId(id);

        const agendamento = new Agendamento({
            ...dados,
            id,
            status: existente.status,
            observacoes: dados.observacoes ?? existente.observacoes
        });

        await this.garantirClienteAtivo(agendamento.clienteId);
        await this.garantirPetAtivo(agendamento.petId);
        await this.garantirHorarioLivre(agendamento.dataHora, id);

        const atualizado = await this.agendamentoRepository.update(id, agendamento);
        if (!atualizado) {
            throw new NotFoundError("Agendamento não encontrado.");
        }
        return atualizado;
    }

    async alterarStatus(id: string, novoStatus: AgendamentoStatus): Promise<Agendamento> {
        const agendamento = await this.buscarPorId(id);
        agendamento.alterarStatus(novoStatus);

        const atualizado = await this.agendamentoRepository.update(id, agendamento);
        if (!atualizado) {
            throw new NotFoundError("Agendamento não encontrado.");
        }
        return atualizado;
    }

    async remover(id: string): Promise<void> {
        const agendamento = await this.buscarPorId(id);

        if (agendamento.status === "concluido") {
            throw new ConflictError("Não é possível excluir um agendamento concluído.");
        }

        await this.agendamentoRepository.remove(id);
    }

    private async garantirClienteAtivo(clienteId: string): Promise<void> {
        const cliente = await this.clienteRepository.findById(clienteId);
        if (!cliente) {
            throw new NotFoundError("Cliente não encontrado.");
        }
        if (!cliente.activo) {
            throw new ConflictError("Não é possível realizar agendamento para um cliente inativo.");
        }
    }

    private async garantirPetAtivo(petId: string): Promise<void> {
        const pet = await this.petRepository.findById(petId);
        if (!pet) {
            throw new NotFoundError("Pet não encontrado.");
        }
        if (!pet.activo) {
            throw new ConflictError("Não é possível realizar agendamento para um pet inativo.");
        }
    }

    private async garantirHorarioLivre(dataHora: string, ignorarId?: string): Promise<void> {
        const agendamentos = await this.agendamentoRepository.findAll();

        const existente = agendamentos.find(
            (agendamento) =>
                agendamento.dataHora === dataHora &&
                agendamento.id !== ignorarId
        );

        if (existente) {
            throw new ConflictError("Já existe um agendamento para esse horário.");
        }
    }
}
