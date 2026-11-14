import type { Response } from 'express';
import { AppError } from './AppError.js';

export function handleError(error: unknown, res: Response): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}