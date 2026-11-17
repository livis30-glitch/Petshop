import type { Request, Response } from "express";
import ClienteService from "../services/ClienteService.js";
import { handleError } from "../errors/handleError.js";

const service = new ClienteService();

async function findAll(req: Request, res: Response): Promise<void> {
    try {
        const clientes = await service.listar();
        res.status(200).json(clientes);
    } catch (error) {
        handleError(error, res);
    }
}

async function searchByKeyword(req: Request<{ keyword: string }>, res: Response): Promise<void> {
    try {
        const clientes = await service.buscarPorPalavra(req.params.keyword);
        res.status(200).json(clientes);
    } catch (error) {
        handleError(error, res);
    }
}

async function findById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
        const cliente = await service.buscarPorId(req.params.id);
        res.status(200).json(cliente);
    } catch (error) {
        handleError(error, res);
    }
}

async function create(req: Request, res: Response): Promise<void> {
    try {
        const cliente = await service.criar(req.body ?? {});
        res.status(201).json(cliente);
    } catch (error) {
        handleError(error, res);
    }
}

async function update(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
        const cliente = await service.atualizar(req.params.id, req.body ?? {});
        res.status(200).json(cliente);
    } catch (error) {
        handleError(error, res);
    }
}

async function remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
        await service.remover(req.params.id);
        res.status(200).json({ mensagem: "Cliente excluído com sucesso." });
    } catch (error) {
        handleError(error, res);
    }
}

export default {
    findAll,
    searchByKeyword,
    findById,
    create,
    update,
    remove
};