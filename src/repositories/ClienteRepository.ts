import supabase from "../config/supabase.js";
import Cliente, { type ClienteRow } from "../models/Cliente.js";
import { ConflictError } from "../errors/AppError.js";

const TABELA = "clientes";

function tratarErro(error: { code?: string }): never {
    if (error.code === "23505") {
        throw new ConflictError("Já existe um cliente com esse e-mail.");
    }
    if (error.code === "23503") {
        throw new ConflictError("O cliente possui registros vinculados.");
    }
    throw error;
}

export default class ClienteRepository {
    async findAll(): Promise<Cliente[]> {
        const { data, error } = await supabase.from(TABELA).select("*").order("nome");
        if (error) tratarErro(error);
        return (data ?? []).map((row) => Cliente.restore(row as ClienteRow));
    }

    async findById(id: string): Promise<Cliente | null> {
        const { data, error } = await supabase.from(TABELA).select("*").eq("id", id).maybeSingle();
        if (error) tratarErro(error);
        return data ? Cliente.restore(data as ClienteRow) : null;
    }

    async findByEmail(email: string): Promise<Cliente | null> {
        const { data, error } = await supabase.from(TABELA).select("*").eq("email", email).maybeSingle();
        if (error) tratarErro(error);
        return data ? Cliente.restore(data as ClienteRow) : null;
    }

    async create(cliente: Cliente): Promise<Cliente> {
        const { data, error } = await supabase
            .from(TABELA)
            .insert(cliente.toPersistence())
            .select()
            .single();
        if (error) tratarErro(error);
        return Cliente.restore(data as ClienteRow);
    }

    async update(id: string, cliente: Cliente): Promise<Cliente | null> {
        const { data, error } = await supabase
            .from(TABELA)
            .update(cliente.toPersistence())
            .eq("id", id)
            .select()
            .maybeSingle();
        if (error) tratarErro(error);
        return data ? Cliente.restore(data as ClienteRow) : null;
    }

    async remove(id: string): Promise<boolean> {
        const { data, error } = await supabase.from(TABELA).delete().eq("id", id).select("id");
        if (error) tratarErro(error);
        return (data ?? []).length > 0;
    }

    async searchByKeyword(keyword: string): Promise<Cliente[]> {
        const termo = keyword.replace(/[,()%]/g, " ").trim();
        const { data, error } = await supabase
            .from(TABELA)
            .select("*")
            .or(`nome.ilike.%${termo}%,email.ilike.%${termo}%,telefone.ilike.%${termo}%`)
            .order("nome");
        if (error) tratarErro(error);
        return (data ?? []).map((row) => Cliente.restore(row as ClienteRow));
    }
}