import type { Request, Response } from "express";
import Pet from "../models/Pet.js";

async function getAll(req: Request, res: Response) {
    try {
        const pets = await Pet.findAll();

        res.status(200).json(pets);
    } catch (error) {
        console.error("Erro ao buscar pets: ", error);

        res.status(500).json({
            message: "Erro ao buscar pets.",
        });
    }
}

async function getByKeyword(req: Request<{ keyword: string }>, res: Response) {
    const { keyword } = req.params;

    if (!keyword || typeof keyword != "string") {
        res.status(400).json({
            message: "Palavra-chave não informada."
        });
        return;
    }

    try {
        const pets = await Pet.searchByKeyword(keyword);

        res.status(200).json(pets);
    } catch (error) {
        console.error("Erro ao pesquisar por pet: ", error);

        res.status(500).json({
            message: "Erro ao pesquisar pet.",
        });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Pet não informado."
        });
        return;
    }

    try {
        const pet = await Pet.findById(id);

        res.status(200).json(pet);
    } catch (error) {
        console.error("Erro ao buscar pet: ", error);

        res.status(404).json({
            message: "Pet não encontrado.",
        });
    }
}

async function create(req: Request, res: Response) {
    try {
        const pet = await Pet.create(req.body);

        res.status(200).json(pet);
    } catch (error) {
        console.error("Erro ao criar pet: ", error);

        res.status(500).json({
            message: "Erro ao criar pet.",
        });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Pet não informado."
        });
        return;
    }

    try {
        const pet = await Pet.update(id, req.body);

        res.status(200).json(pet);
    } catch (error) {
        console.error("Erro ao atualizar pet: ", error);

        res.status(500).json({
            message: "Erro ao atualizar pet.",
        });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(404).json({
            message: "ID do Pet não informado."
        });
        return;
    }

    try {
        await Pet.remove(id);

        res.status(200).json({
            message: "Pet removido com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao remover pet: ", error);

        res.status(500).json({
            message: "Erro ao remover pet.",
        });
    }
}

export default {
    getAll,
    getById,
    getByKeyword,
    create,
    update,
    remove
}