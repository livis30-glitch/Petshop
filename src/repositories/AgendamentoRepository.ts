
import supabase from "../config/supabase.js";
import Agendamento, { type AgendamentoRow } from "../models/Agendamento.js";
import { ConflictError } from "../errors/ConflictError.js";

const TABELA = "agendamentos";

function tratarErro(error: { code?: string }): never {
    if (error.code === "23505") {
        throw new ConflictError("Já existe um agendamento com esses dados.");
    }
    if (error.code === "23503") {
        throw new ConflictError("Operação não permitida: o cliente ou pet não existe ou possui registros vinculados.");
    }
    throw error;
}

export default class AgendamentoRepository {
    async findAll(): Promise<Agendamento[]> {
        const { data, error } = await supabase
            .from(TABELA)
            .select("*")
            .order("data_hora");

        if (error) tratarErro(error);
        return (data ?? []).map((row) => Agendamento.restore(row as AgendamentoRow));
    }

    async findById(id: string): Promise<Agendamento | null> {
        const { data, error } = await supabase
            .from(TABELA)
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (error) tratarErro(error);
        return data ? Agendamento.restore(data as AgendamentoRow) : null;
    }

    async create(agendamento: Agendamento): Promise<Agendamento> {
        const { data, error } = await supabase
            .from(TABELA)
            .insert(agendamento.toPersistence())
            .select()
            .single();

        if (error) tratarErro(error);
        return Agendamento.restore(data as AgendamentoRow);
    }

    async update(id: string, agendamento: Agendamento): Promise<Agendamento | null> {
        const { data, error } = await supabase
            .from(TABELA)
            .update(agendamento.toPersistence())
            .eq("id", id)
            .select()
            .maybeSingle();

        if (error) tratarErro(error);
        return data ? Agendamento.restore(data as AgendamentoRow) : null;
    }

    async remove(id: string): Promise<boolean> {
        const { data, error } = await supabase
            .from(TABELA)
            .delete()
            .eq("id", id)
            .select("id");

        if (error) tratarErro(error);
        return (data ?? []).length > 0;
    }

    async searchByKeyword(keyword: string): Promise<Agendamento[]> {
        const termo = keyword.replace(/[,()%]/g, " ").trim();

        const { data, error } = await supabase
            .from(TABELA)
            .select("*")
            .or(`servico.ilike.%${termo}%,observacoes.ilike.%${termo}%`)
            .order("data_hora");

        if (error) tratarErro(error);
        return (data ?? []).map((row) => Agendamento.restore(row as AgendamentoRow));
    }
}
