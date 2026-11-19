
import type { Request, Response } from "express";
import AgendamentoService from "../services/AgendamentoService.js";
import { handleError } from "../errors/handleError.js";

const service = new AgendamentoService();

async function findAll(req: Request, res: Response): Promise<void> {
    try {
        const agendamentos = await service.listar();
        res.status(200).json(agendamentos);
    } catch (error) {
        handleError(error, res);
    }
}

async function searchByKeyword(req: Request<{ keyword: string }>, res: Response): Promise<void> {
    try {
        const agendamentos = await service.buscarPorPalavra(req.params.keyword);
        res.status(200).json(agendamentos);
    } catch (error) {
        handleError(error, res);
    }
}

async function findById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
        const agendamento = await service.buscarPorId(req.params.id);
        res.status(200).json(agendamento);
    } catch (error) {
        handleError(error, res);
    }
}

async function create(req: Request, res: Response): Promise<void> {
    try {
        const agendamento = await service.criar(req.body ?? {});
        res.status(201).json(agendamento);
    } catch (error) {
        handleError(error, res);
    }
}

async function update(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
        const agendamento = await service.atualizar(req.params.id, req.body ?? {});
        res.status(200).json(agendamento);
    } catch (error) {
        handleError(error, res);
    }
}

async function updateStatus(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
        const agendamento = await service.alterarStatus(req.params.id, req.body.status);
        res.status(200).json(agendamento);
    } catch (error) {
        handleError(error, res);
    }
}

async function remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
        await service.remover(req.params.id);
        res.status(200).json({ mensagem: "Agendamento excluído com sucesso." });
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
    updateStatus,
    remove
};
