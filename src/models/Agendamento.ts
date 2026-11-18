

import { ValidationError } from "../errors/ValidationError.js";
import { ehDataFutura, ehTextoValido, ehUuidValido } from "../utils/validators.js";

export type AgendamentoStatus = "agendado" | "concluido" | "cancelado";

export interface AgendamentoProps {
    id?: string | undefined;
    cliente_id: string;
    pet_id: string;
    data_hora: string;
    servico: string;
    status?: AgendamentoStatus | undefined;
    observacoes?: string | null | undefined;
}

export interface AgendamentoRow {
    id: string;
    cliente_id: string;
    pet_id: string;
    data_hora: string;
    servico: string;
    status: AgendamentoStatus;
    observacoes: string | null;
}

export default class Agendamento {
    private _id: string | undefined;
    private _clienteId: string;
    private _petId: string;
    private _dataHora: string;
    private _servico: string;
    private _status: AgendamentoStatus;
    private _observacoes: string | null;

    constructor(props: AgendamentoProps, validar = true) {
        const servico = typeof props.servico === "string" ? props.servico.trim() : props.servico;
        const dataHora = props.data_hora;
        const status = props.status === undefined ? "agendado" : props.status;
        const observacoes = typeof props.observacoes === "string"
            ? props.observacoes.trim()
            : props.observacoes ?? null;

        if (validar) {
            Agendamento.validarClienteId(props.cliente_id);
            Agendamento.validarPetId(props.pet_id);
            Agendamento.validarDataHora(dataHora);
            Agendamento.validarServico(servico);
            Agendamento.validarStatus(status);
            Agendamento.validarObservacoes(observacoes);
        }

        this._id = props.id;
        this._clienteId = props.cliente_id;
        this._petId = props.pet_id;
        this._dataHora = dataHora;
        this._servico = servico;
        this._status = status;
        this._observacoes = observacoes;
    }

    static restore(row: AgendamentoRow): Agendamento {
        return new Agendamento(
            {
                id: row.id,
                cliente_id: row.cliente_id,
                pet_id: row.pet_id,
                data_hora: row.data_hora,
                servico: row.servico,
                status: row.status,
                observacoes: row.observacoes
            },
            false
        );
    }

    private static validarClienteId(clienteId: unknown): void {
        if (!ehUuidValido(clienteId)) {
            throw new ValidationError("cliente_id é obrigatório e deve ser um UUID válido.");
        }
    }

    private static validarPetId(petId: unknown): void {
        if (!ehUuidValido(petId)) {
            throw new ValidationError("pet_id é obrigatório e deve ser um UUID válido.");
        }
    }

    private static validarDataHora(dataHora: unknown): void {
        if (!ehDataFutura(dataHora)) {
            throw new ValidationError("Data do agendamento deve ser uma data futura válida.");
        }
    }

    private static validarServico(servico: unknown): void {
        if (!ehTextoValido(servico, 1, Number.MAX_SAFE_INTEGER)) {
            throw new ValidationError("Serviço é obrigatório.");
        }
    }

    private static validarStatus(status: unknown): void {
        if (
            status !== "agendado" &&
            status !== "concluido" &&
            status !== "cancelado"
        ) {
            throw new ValidationError("Status do agendamento inválido.");
        }
    }

    private static validarObservacoes(observacoes: unknown): void {
        if (observacoes !== null && typeof observacoes !== "string") {
            throw new ValidationError("As observações devem ser um texto.");
        }
    }

    get id(): string | undefined {
        return this._id;
    }

    get clienteId(): string {
        return this._clienteId;
    }

    get petId(): string {
        return this._petId;
    }

    get dataHora(): string {
        return this._dataHora;
    }

    get servico(): string {
        return this._servico;
    }

    get status(): AgendamentoStatus {
        return this._status;
    }

    get observacoes(): string | null {
        return this._observacoes;
    }

    alterarStatus(novoStatus: AgendamentoStatus): void {
        Agendamento.validarStatus(novoStatus);

        if (this._status !== "agendado") {
            throw new ValidationError("Somente agendamentos com status agendado podem ser alterados.");
        }

        if (novoStatus === "agendado") {
            throw new ValidationError("O novo status deve ser concluido ou cancelado.");
        }

        this._status = novoStatus;
    }

    alterarObservacoes(novasObservacoes: string | null): void {
        Agendamento.validarObservacoes(novasObservacoes);
        this._observacoes = typeof novasObservacoes === "string"
            ? novasObservacoes.trim()
            : null;
    }

    toPersistence() {
        return {
            cliente_id: this._clienteId,
            pet_id: this._petId,
            data_hora: this._dataHora,
            servico: this._servico,
            status: this._status,
            observacoes: this._observacoes
        };
    }

    toJSON() {
        return {
            id: this._id,
            ...this.toPersistence()
        };
    }
}
