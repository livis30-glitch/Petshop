
import { ValidationError } from "../errors/AppError.js";
import { ehInteiroNaoNegativo, ehTextoValido, ehUuidValido } from "../utils/validators.js";

export interface PetProps {
    id?: string | undefined;
    cliente_id: string;
    nome: string;
    especie: string;
    raca: string;
    idade: number;
    activo?: boolean | undefined;
}

export interface PetRow {
    id: string;
    cliente_id: string;
    nome: string;
    especie: string;
    raca: string;
    idade: number;
    activo: boolean | null;
}

export default class Pet {
    private _id: string | undefined;
    private _clienteId: string;
    private _nome: string;
    private _especie: string;
    private _raca: string;
    private _idade: number;
    private _activo: boolean;

    constructor(props: PetProps, validar = true) {
        const nome = typeof props.nome === "string" ? props.nome.trim() : props.nome;
        const especie = typeof props.especie === "string" ? props.especie.trim() : props.especie;
        const raca = typeof props.raca === "string" ? props.raca.trim() : props.raca;
        const activo = props.activo === undefined ? true : props.activo;

        if (validar) {
            Pet.validarClienteId(props.cliente_id);
            Pet.validarNome(nome);
            Pet.validarEspecie(especie);
            Pet.validarRaca(raca);
            Pet.validarIdade(props.idade);
            Pet.validarActivo(activo);
        }

        this._id = props.id;
        this._clienteId = props.cliente_id;
        this._nome = nome;
        this._especie = especie;
        this._raca = raca;
        this._idade = props.idade;
        this._activo = activo;
    }

    static restore(row: PetRow): Pet {
        return new Pet(
            {
                id: row.id,
                cliente_id: row.cliente_id,
                nome: row.nome,
                especie: row.especie,
                raca: row.raca,
                idade: row.idade,
                activo: row.activo ?? true
            },
            false
        );
    }

    private static validarClienteId(clienteId: unknown): void {
        if (!ehUuidValido(clienteId)) {
            throw new ValidationError("cliente_id é obrigatório e deve ser um UUID válido.");
        }
    }

    private static validarNome(nome: unknown): void {
        if (!ehTextoValido(nome, 1, 100)) {
            throw new ValidationError("Nome do pet é obrigatório (até 100 caracteres).");
        }
    }

    private static validarEspecie(especie: unknown): void {
        if (!ehTextoValido(especie, 2, 50)) {
            throw new ValidationError("Espécie do pet é obrigatória (de 2 a 50 caracteres).");
        }
    }

    private static validarRaca(raca: unknown): void {
        if (!ehTextoValido(raca, 1, 50)) {
            throw new ValidationError("Raça do pet é obrigatória (até 50 caracteres).");
        }
    }

    private static validarIdade(idade: unknown): void {
        if (!ehInteiroNaoNegativo(idade, 50)) {
            throw new ValidationError("Idade do pet deve ser um número inteiro entre 0 e 50.");
        }
    }

    private static validarActivo(activo: unknown): void {
        if (typeof activo !== "boolean") {
            throw new ValidationError("O campo activo deve ser verdadeiro ou falso.");
        }
    }

    get id(): string | undefined {
        return this._id;
    }

    get clienteId(): string {
        return this._clienteId;
    }

    get nome(): string {
        return this._nome;
    }

    get especie(): string {
        return this._especie;
    }

    get raca(): string {
        return this._raca;
    }

    get idade(): number {
        return this._idade;
    }

    get activo(): boolean {
        return this._activo;
    }

    renomear(novoNome: string): void {
        const nome = typeof novoNome === "string" ? novoNome.trim() : novoNome;
        Pet.validarNome(nome);
        this._nome = nome;
    }

    alterarIdade(novaIdade: number): void {
        Pet.validarIdade(novaIdade);
        this._idade = novaIdade;
    }

    ativar(): void {
        this._activo = true;
    }

    desativar(): void {
        this._activo = false;
    }

    toPersistence() {
        return {
            cliente_id: this._clienteId,
            nome: this._nome,
            especie: this._especie,
            raca: this._raca,
            idade: this._idade,
            activo: this._activo
        };
    }

    toJSON() {
        return {
            id: this._id,
            ...this.toPersistence()
        };
    }
}
