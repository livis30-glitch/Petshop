import supabase from "../config/supabase.js";
import Pet, { type PetRow } from "../models/Pet.js";
import { ConflictError } from "../errors/ConflictError.js";

const TABELA = "pets";

function tratarErro(error: { code?: string }): never {
    if (error.code === "23503") {
        throw new ConflictError("Operação não permitida: o pet possui registros vinculados ou o cliente não existe.");
    }
    throw error;
}

export default class PetRepository {
    async findAll(): Promise<Pet[]> {
        const { data, error } = await supabase.from(TABELA).select("*").order("nome");
        if (error) tratarErro(error);
        return (data ?? []).map((row) => Pet.restore(row as PetRow));
    }

    async findById(id: string): Promise<Pet | null> {
        const { data, error } = await supabase.from(TABELA).select("*").eq("id", id).maybeSingle();
        if (error) tratarErro(error);
        return data ? Pet.restore(data as PetRow) : null;
    }

    async findByClienteId(clienteId: string): Promise<Pet[]> {
        const { data, error } = await supabase
            .from(TABELA)
            .select("*")
            .eq("cliente_id", clienteId)
            .order("nome");
        if (error) tratarErro(error);
        return (data ?? []).map((row) => Pet.restore(row as PetRow));
    }

    async create(pet: Pet): Promise<Pet> {
        const { data, error } = await supabase
            .from(TABELA)
            .insert(pet.toPersistence())
            .select()
            .single();
        if (error) tratarErro(error);
        return Pet.restore(data as PetRow);
    }

    async update(id: string, pet: Pet): Promise<Pet | null> {
        const { data, error } = await supabase
            .from(TABELA)
            .update(pet.toPersistence())
            .eq("id", id)
            .select()
            .maybeSingle();
        if (error) tratarErro(error);
        return data ? Pet.restore(data as PetRow) : null;
    }

    async remove(id: string): Promise<boolean> {
        const { data, error } = await supabase.from(TABELA).delete().eq("id", id).select("id");
        if (error) tratarErro(error);
        return (data ?? []).length > 0;
    }

    async searchByKeyword(keyword: string): Promise<Pet[]> {
        const termo = keyword.replace(/[,()%]/g, " ").trim();
        const { data, error } = await supabase
            .from(TABELA)
            .select("*")
            .or(`nome.ilike.%${termo}%,especie.ilike.%${termo}%,raca.ilike.%${termo}%`)
            .order("nome");
        if (error) tratarErro(error);
        return (data ?? []).map((row) => Pet.restore(row as PetRow));
    }
}