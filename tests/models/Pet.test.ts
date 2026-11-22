import { describe, it, expect } from "vitest";
import Pet from "../../src/models/Pet.js";
import { ValidationError } from "../../src/errors/AppError.js";

const CLIENTE_ID = "123e4567-e89b-12d3-a456-426614174000";

const dadosValidos = {
    cliente_id: CLIENTE_ID,
    nome: "Rex",
    especie: "Cachorro",
    raca: "Labrador",
    idade: 3
};

describe("Model Pet", () => {
    describe("constructor", () => {
        it("cria um pet válido, ativo por padrão", () => {
            const pet = new Pet(dadosValidos);

            expect(pet.id).toBeUndefined();
            expect(pet.clienteId).toBe(CLIENTE_ID);
            expect(pet.nome).toBe("Rex");
            expect(pet.especie).toBe("Cachorro");
            expect(pet.raca).toBe("Labrador");
            expect(pet.idade).toBe(3);
            expect(pet.activo).toBe(true);
        });

        it("remove espaços dos textos", () => {
            const pet = new Pet({ ...dadosValidos, nome: "  Rex ", especie: " Cachorro ", raca: " Labrador " });
            expect(pet.nome).toBe("Rex");
            expect(pet.especie).toBe("Cachorro");
            expect(pet.raca).toBe("Labrador");
        });

        it("aceita idade 0", () => {
            const pet = new Pet({ ...dadosValidos, idade: 0 });
            expect(pet.idade).toBe(0);
        });

        it("rejeita cliente_id que não é UUID", () => {
            expect(() => new Pet({ ...dadosValidos, cliente_id: "abc" })).toThrow(ValidationError);
        });

        it("rejeita nome vazio", () => {
            expect(() => new Pet({ ...dadosValidos, nome: "   " })).toThrow(ValidationError);
        });

        it("rejeita espécie com menos de 2 caracteres", () => {
            expect(() => new Pet({ ...dadosValidos, especie: "A" })).toThrow(ValidationError);
        });

        it("rejeita raça vazia", () => {
            expect(() => new Pet({ ...dadosValidos, raca: "" })).toThrow(ValidationError);
        });

        it("rejeita idade negativa", () => {
            expect(() => new Pet({ ...dadosValidos, idade: -1 })).toThrow(ValidationError);
        });

        it("rejeita idade decimal", () => {
            expect(() => new Pet({ ...dadosValidos, idade: 1.5 })).toThrow(ValidationError);
        });

        it("rejeita idade acima de 50", () => {
            expect(() => new Pet({ ...dadosValidos, idade: 51 })).toThrow(ValidationError);
        });

        it("rejeita idade que não é número", () => {
            const props = { ...dadosValidos, idade: "3" as unknown as number };
            expect(() => new Pet(props)).toThrow(ValidationError);
        });

        it("rejeita activo que não é booleano", () => {
            const props = { ...dadosValidos, activo: "sim" as unknown as boolean };
            expect(() => new Pet(props)).toThrow(ValidationError);
        });
    });

    describe("restore", () => {
        it("monta o objeto vindo do banco sem validar", () => {
            const pet = Pet.restore({
                id: "pet-1",
                cliente_id: "qualquer",
                nome: "",
                especie: "",
                raca: "",
                idade: -5,
                activo: null
            });

            expect(pet.id).toBe("pet-1");
            expect(pet.activo).toBe(true);
        });
    });

    describe("métodos", () => {
        it("renomear altera o nome", () => {
            const pet = new Pet(dadosValidos);
            pet.renomear(" Thor ");
            expect(pet.nome).toBe("Thor");
        });

        it("renomear rejeita nome inválido e mantém o anterior", () => {
            const pet = new Pet(dadosValidos);
            expect(() => pet.renomear("")).toThrow(ValidationError);
            expect(pet.nome).toBe("Rex");
        });

        it("alterarIdade altera a idade", () => {
            const pet = new Pet(dadosValidos);
            pet.alterarIdade(5);
            expect(pet.idade).toBe(5);
        });

        it("alterarIdade rejeita idade inválida", () => {
            const pet = new Pet(dadosValidos);
            expect(() => pet.alterarIdade(-2)).toThrow(ValidationError);
            expect(pet.idade).toBe(3);
        });

        it("desativar e ativar mudam o status", () => {
            const pet = new Pet(dadosValidos);
            pet.desativar();
            expect(pet.activo).toBe(false);
            pet.ativar();
            expect(pet.activo).toBe(true);
        });
    });

    describe("serialização", () => {
        it("toPersistence não inclui o id", () => {
            const pet = new Pet({ ...dadosValidos, id: "pet-1" });
            expect(pet.toPersistence()).toEqual({
                cliente_id: CLIENTE_ID,
                nome: "Rex",
                especie: "Cachorro",
                raca: "Labrador",
                idade: 3,
                activo: true
            });
        });

        it("toJSON inclui o id e os campos", () => {
            const pet = new Pet({ ...dadosValidos, id: "pet-1" });
            expect(pet.toJSON()).toEqual({
                id: "pet-1",
                cliente_id: CLIENTE_ID,
                nome: "Rex",
                especie: "Cachorro",
                raca: "Labrador",
                idade: 3,
                activo: true
            });
        });
    });
});