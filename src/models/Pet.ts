import supabase from "../config/supabase.js";

async function findAll() {
    const {data, error} = await supabase
        .from("pets")
        .select("*");

    if (error) {
        throw error;
    }
    return data;
}

async function findById(id: string) {
    const {data, error} = await supabase
        .from("pets")
        .select("*")
        .eq("id", id)
        .single();
    
    if (error) {
        throw error;
    }
    return data;
}

async function create(pet: {
    cliente_id: string;
    nome: string;
    especie: string;
    raca: string;
    idade: number;
    activo: boolean;
}) {
    const {data, error} = await supabase
        .from("pets")
        .insert(pet)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}  

async function update(
    id: string, 
    pet: {
        cliente_id: string;
        nome: string;
        especie: string;
        raca: string;
        idade: number;
        activo: boolean;
    }
){
    const {data, error} = await supabase
        .from("pets")
        .update(pet)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
}

async function remove(id: string) {
    const {data, error} = await supabase
        .from("pets")
        .delete()
        .eq("id", id)
        .single();

    if (error) {
        throw error;
    }
    return data;
}

export default {
    findAll,
    findById,
    create,
    update,
    remove
}