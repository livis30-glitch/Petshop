create table if not exists clientes (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text not null,
    telefone text not null,
    activo boolean not null default true
);


create unique index if not exists clientes_email_unico on clientes (lower(email));

create table if not exists pets (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references clientes(id),
    nome text not null,
    especie text not null,
    raca text not null,
    idade integer not null,
    activo boolean not null default true
);

create index if not exists pets_cliente_id_idx on pets (cliente_id);

create table if not exists agendamentos (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references clientes(id),
    pet_id uuid not null references pets(id),
    data_hora timestamptz not null,
    servico text not null,
    status text not null default 'agendado'
        check (status in ('agendado', 'concluido', 'cancelado')),
    observacoes text
);

create unique index if not exists agendamentos_horario_unico
    on agendamentos (data_hora)
    where status <> 'cancelado';

create index if not exists agendamentos_pet_id_idx on agendamentos (pet_id);
create index if not exists agendamentos_cliente_id_idx on agendamentos (cliente_id);