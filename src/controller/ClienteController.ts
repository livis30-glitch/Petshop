import type { Request, Response } from "express";
import Cliente from "../models/Cliente.js";

async function getAll(req: Request, res: Response) {
    try {
        const clientes = await Cliente.findAll();

        res.status(200).json(clientes);
    } catch (error) {
        console.error("Erro ao buscar clientes;", error);

        res.status(500).json({
            message: "Erro ao buscar clientes",
        });
    }
}

async function getByKeyword(req: Request<{ keyword: string }>, res: Response) {
    const { keyword } = req.params;

    if (!keyword || typeof keyword !== "string") {
        res.status(400).json({
            message: "Palavra-chave não informada."
        });
        return;
    }

    try {
        const clientes = await Cliente.searchByKeyword(keyword);

        res.status(200).json(clientes);
    } catch (error) {
        console.error("Erro ao buscar por clientes", error);

        res.status(500).json({
            message: "Erro ao buscar clientes",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({
            message: "ID do cliente não informado."
        });
        return;
    }

    try {
        const cliente = await Cliente.findById(id);

        res.status(200).json(cliente);
    } catch (error) {
        console.error("Erro ao buscar cliente;", error);

        res.status(400).json({
            message: "Cliente não encontrado.",
        });
    }
}

async function create(req: Request, res: Response) {
    try {
        const cliente = await Cliente.create(req.body);

        res.status(201).json(cliente);
    } catch (error) {
        console.error("Erro ao criar cliente;", error);

        res.status(500).json({
            message: "Erro ao criar cliente.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({
            message: "ID do cliente não informado."
        });
        return;
    }

    try {
        const cliente = await Cliente.update(id, req.body);

        res.status(200).json(cliente);
    } catch (error) {
        console.error("Erro ao atualizar cliente;", error);

        res.status(500).json({
            message: "Erro ao atualizar cliente.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do cliente não informado."
        });
        return;
    }

    try {
        await Cliente.remove(id);

        res.status(200).json({
            message: "Cliente removido com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao remover cliente;", error);

        res.status(500).json({
            message: "Erro ao remover cliente.",
        });
    }
}

export default {
    getAll,
    getByKeyword,
    getById,
    create,
    update,
    remove
};