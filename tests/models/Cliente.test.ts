import { describe, it, expect } from "vitest";
import Cliente from "../../src/models/Cliente.js";
import { ValidationError } from "../../src/errors/AppError.js";

const dadosValidos = {
    nome: "Maria Silva",
    email: "maria@email.com",
    telefone: "(41) 99999-0000"
};

describe("Model Cliente", () => {
    describe("constructor", () => {
        it("cria um cliente válido, ativo por padrão", () => {
            const cliente = new Cliente(dadosValidos);

            expect(cliente.id).toBeUndefined();
            expect(cliente.nome).toBe("Maria Silva");
            expect(cliente.email).toBe("maria@email.com");
            expect(cliente.telefone).toBe("(41) 99999-0000");
            expect(cliente.activo).toBe(true);
        });

        it("remove espaços do nome e normaliza o e-mail", () => {
            const cliente = new Cliente({
                ...dadosValidos,
                nome: "  Maria Silva  ",
                email: "  MARIA@Email.com "
            });

            expect(cliente.nome).toBe("Maria Silva");
            expect(cliente.email).toBe("maria@email.com");
        });

        it("aceita telefone fixo com DDD", () => {
            const cliente = new Cliente({ ...dadosValidos, telefone: "(41) 3333-4444" });
            expect(cliente.telefone).toBe("(41) 3333-4444");
        });

        it("aceita criar um cliente inativo", () => {
            const cliente = new Cliente({ ...dadosValidos, activo: false });
            expect(cliente.activo).toBe(false);
        });

        it("rejeita nome com menos de 2 caracteres", () => {
            expect(() => new Cliente({ ...dadosValidos, nome: "A" })).toThrow(ValidationError);
        });

        it("rejeita nome vazio", () => {
            expect(() => new Cliente({ ...dadosValidos, nome: "   " })).toThrow(ValidationError);
        });

        it("rejeita nome que não é texto", () => {
            const props = { ...dadosValidos, nome: 123 as unknown as string };
            expect(() => new Cliente(props)).toThrow(ValidationError);
        });

        it("rejeita e-mail inválido", () => {
            expect(() => new Cliente({ ...dadosValidos, email: "maria.email.com" })).toThrow(ValidationError);
        });

        it("rejeita telefone sem DDD", () => {
            expect(() => new Cliente({ ...dadosValidos, telefone: "99999-0000" })).toThrow(ValidationError);
        });

        it("rejeita telefone com letras", () => {
            expect(() => new Cliente({ ...dadosValidos, telefone: "abc" })).toThrow(ValidationError);
        });

        it("rejeita activo que não é booleano", () => {
            const props = { ...dadosValidos, activo: "sim" as unknown as boolean };
            expect(() => new Cliente(props)).toThrow(ValidationError);
        });
    });

    describe("restore", () => {
        it("monta o objeto vindo do banco sem validar", () => {
            const cliente = Cliente.restore({
                id: "id-1",
                nome: "",
                email: "invalido",
                telefone: "1",
                activo: null
            });

            expect(cliente.id).toBe("id-1");
            expect(cliente.activo).toBe(true);
        });
    });

    describe("métodos", () => {
        it("renomear altera o nome", () => {
            const cliente = new Cliente(dadosValidos);
            cliente.renomear("  Ana Paula ");
            expect(cliente.nome).toBe("Ana Paula");
        });

        it("renomear rejeita nome inválido e mantém o anterior", () => {
            const cliente = new Cliente(dadosValidos);
            expect(() => cliente.renomear("A")).toThrow(ValidationError);
            expect(cliente.nome).toBe("Maria Silva");
        });

        it("alterarEmail altera e normaliza o e-mail", () => {
            const cliente = new Cliente(dadosValidos);
            cliente.alterarEmail("NOVO@Email.com");
            expect(cliente.email).toBe("novo@email.com");
        });

        it("alterarEmail rejeita e-mail inválido", () => {
            const cliente = new Cliente(dadosValidos);
            expect(() => cliente.alterarEmail("sem-arroba")).toThrow(ValidationError);
            expect(cliente.email).toBe("maria@email.com");
        });

        it("alterarTelefone altera o telefone", () => {
            const cliente = new Cliente(dadosValidos);
            cliente.alterarTelefone("(11) 98888-7777");
            expect(cliente.telefone).toBe("(11) 98888-7777");
        });

        it("alterarTelefone rejeita telefone inválido", () => {
            const cliente = new Cliente(dadosValidos);
            expect(() => cliente.alterarTelefone("123")).toThrow(ValidationError);
        });

        it("desativar e ativar mudam o status", () => {
            const cliente = new Cliente(dadosValidos);
            cliente.desativar();
            expect(cliente.activo).toBe(false);
            cliente.ativar();
            expect(cliente.activo).toBe(true);
        });
    });

    describe("serialização", () => {
        it("toPersistence não inclui o id", () => {
            const cliente = new Cliente({ ...dadosValidos, id: "id-1" });
            expect(cliente.toPersistence()).toEqual({
                nome: "Maria Silva",
                email: "maria@email.com",
                telefone: "(41) 99999-0000",
                activo: true
            });
        });

        it("toJSON inclui o id e os campos", () => {
            const cliente = new Cliente({ ...dadosValidos, id: "id-1" });
            expect(cliente.toJSON()).toEqual({
                id: "id-1",
                nome: "Maria Silva",
                email: "maria@email.com",
                telefone: "(41) 99999-0000",
                activo: true
            });
        });
    });
});