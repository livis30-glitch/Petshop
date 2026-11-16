import { ValidationError } from '../errors/ValidationError.js';

export function normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function ehTextoValido(valor: unknown, minimo: number, maximo: number): boolean {
    if (typeof valor !== "string") return false;
    const tamanho = valor.trim().length;
    return tamanho >= minimo && tamanho <= maximo;
}

export function ehEmailValido(valor: unknown): boolean {
    if (typeof valor !== "string") return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

// Aceita com ou sem máscara: precisa ter DDD + número (10 ou 11 dígitos)
export function ehTelefoneValido(valor: unknown): boolean {
    if (typeof valor !== "string") return false;
    const numeros = valor.replace(/\D/g, "");
    if (numeros.length !== 10 && numeros.length !== 11) return false;
    if (!/^[1-9][1-9]/.test(numeros)) return false;
    return numeros.length === 10 || numeros[2] === "9";
}

export function ehInteiroNaoNegativo(valor: unknown, maximo: number): boolean {
    return typeof valor === "number" && Number.isInteger(valor) && valor >= 0 && valor <= maximo;
}

export function ehUuidValido(valor: unknown): boolean {
    if (typeof valor !== "string") return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

export function ehDataFutura(valor: unknown): boolean {
    if (typeof valor !== "string" && !(valor instanceof Date)) return false;
    const data = new Date(valor);
    return !Number.isNaN(data.getTime()) && data.getTime() > Date.now();
}