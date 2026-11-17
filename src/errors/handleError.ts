import type { Response } from "express";
import { AppError } from "./AppError.js";

export function handleError(error: unknown, res: Response): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }

    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor" });
}