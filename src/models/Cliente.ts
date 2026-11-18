import { ValidationError } from "../errors/ValidationError.js";
import { ehEmailValido, ehTelefoneValido, ehTextoValido, normalizarEmail } from "../utils/validators.js";

export interface ClienteProps {
    id?: string | undefined;
    nome: string;
    email: string;
    telefone: string;
    activo?: boolean | undefined;
}

export interface ClienteRow {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    activo: boolean | null;
}

export default class Cliente {
    private _id: string | undefined;
    private _nome: string;
    private _email: string;
    private _telefone: string;
    private _activo: boolean;

    constructor(props: ClienteProps, validar = true) {
        const nome = typeof props.nome === "string" ? props.nome.trim() : props.nome;
        const email = typeof props.email === "string" ? normalizarEmail(props.email) : props.email;
        const telefone = typeof props.telefone === "string" ? props.telefone.trim() : props.telefone;
        const activo = props.activo === undefined ? true : props.activo;

        if (validar) {
            Cliente.validarNome(nome);
            Cliente.validarEmail(email);
            Cliente.validarTelefone(telefone);
            Cliente.validarActivo(activo);
        }

        this._id = props.id;
        this._nome = nome;
        this._email = email;
        this._telefone = telefone;
        this._activo = activo;
    }

    static restore(row: ClienteRow): Cliente {
        return new Cliente(
            {
                id: row.id,
                nome: row.nome,
                email: row.email,
                telefone: row.telefone,
                activo: row.activo ?? true
            },
            false
        );
    }

    private static validarNome(nome: unknown): void {
        if (!ehTextoValido(nome, 2, 100)) {
            throw new ValidationError("Nome do cliente é obrigatório (de 2 a 100 caracteres).");
        }
    }

    private static validarEmail(email: unknown): void {
        if (!ehEmailValido(email)) {
            throw new ValidationError("E-mail do cliente inválido.");
        }
    }

    private static validarTelefone(telefone: unknown): void {
        if (!ehTelefoneValido(telefone)) {
            throw new ValidationError("Telefone inválido. Informe com DDD, ex.: (41) 99999-0000.");
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

    get nome(): string {
        return this._nome;
    }

    get email(): string {
        return this._email;
    }

    get telefone(): string {
        return this._telefone;
    }

    get activo(): boolean {
        return this._activo;
    }

    renomear(novoNome: string): void {
        const nome = typeof novoNome === "string" ? novoNome.trim() : novoNome;
        Cliente.validarNome(nome);
        this._nome = nome;
    }

    alterarEmail(novoEmail: string): void {
        const email = typeof novoEmail === "string" ? normalizarEmail(novoEmail) : novoEmail;
        Cliente.validarEmail(email);
        this._email = email;
    }

    alterarTelefone(novoTelefone: string): void {
        const telefone = typeof novoTelefone === "string" ? novoTelefone.trim() : novoTelefone;
        Cliente.validarTelefone(telefone);
        this._telefone = telefone;
    }

    ativar(): void {
        this._activo = true;
    }

    desativar(): void {
        this._activo = false;
    }

    toPersistence() {
        return {
            nome: this._nome,
            email: this._email,
            telefone: this._telefone,
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
