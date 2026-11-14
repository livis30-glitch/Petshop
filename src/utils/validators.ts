import { ValidationError } from '../errors/ValidationError.js';

export function validarTextoObrigatorio(
  valor: unknown,
  campo: string,
  minimo: number = 2
): string {
  if (typeof valor !== 'string' || valor.trim().length < minimo) {
    throw new ValidationError(
      `${campo} é obrigatório e deve ter pelo menos ${minimo} caracteres`
    );
  }
  return valor.trim();
}

export function validarEmail(valor: unknown): string {
  if (typeof valor !== 'string') {
    throw new ValidationError('E-mail é obrigatório');
  }
  const email = valor.trim().toLowerCase();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    throw new ValidationError('E-mail inválido');
  }
  return email;
}

// Aceita com ou sem máscara, devolve só os números (DDD + número)
export function validarTelefone(valor: unknown): string {
  if (typeof valor !== 'string') {
    throw new ValidationError('Telefone é obrigatório');
  }
  const numeros = valor.replace(/\D/g, '');
  const tamanhoOk = numeros.length === 10 || numeros.length === 11;
  const dddOk = /^[1-9][1-9]/.test(numeros);
  const celularOk = numeros.length === 10 || numeros[2] === '9';
  if (!tamanhoOk || !dddOk || !celularOk) {
    throw new ValidationError('Telefone inválido: informe o DDD + número');
  }
  return numeros;
}

export function validarDataFutura(valor: unknown, campo: string = 'Data'): Date {
  if (typeof valor !== 'string' && !(valor instanceof Date)) {
    throw new ValidationError(`${campo} é obrigatória`);
  }
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    throw new ValidationError(`${campo} inválida`);
  }
  if (data.getTime() <= Date.now()) {
    throw new ValidationError(`${campo} deve ser uma data futura`);
  }
  return data;
}