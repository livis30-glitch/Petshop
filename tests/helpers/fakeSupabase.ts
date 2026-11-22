import { randomUUID } from "node:crypto";

type Linha = Record<string, unknown>;
type ErroBanco = { code: string; message: string };
type Resultado = { data: unknown; error: ErroBanco | null };

// Colunas com restrição UNIQUE (erro 23505)
const COLUNAS_UNICAS: Record<string, string[]> = {
    clientes: ["email"]
};

// Chaves estrangeiras (erro 23503). Se no schema.sql a coluna de agendamentos
// tiver outro nome, ajuste aqui.
const CHAVES_ESTRANGEIRAS = [
    { tabela: "pets", coluna: "cliente_id", referencia: "clientes" },
    { tabela: "agendamentos", coluna: "pet_id", referencia: "pets" },
    { tabela: "agendamentos", coluna: "cliente_id", referencia: "clientes" }
];

class Consulta implements PromiseLike<Resultado> {
    private banco: FakeSupabase;
    private tabela: string;
    private operacao: "select" | "insert" | "update" | "delete" = "select";
    private payload: Linha = {};
    private filtros: Array<(linha: Linha) => boolean> = [];
    private ordem: { coluna: string; asc: boolean } | undefined;
    private retorna = false;
    private modo: "lista" | "unico" | "talvez" = "lista";

    constructor(banco: FakeSupabase, tabela: string) {
        this.banco = banco;
        this.tabela = tabela;
    }

    select(_colunas?: string): this {
        if (this.operacao !== "select") {
            this.retorna = true;
        }
        return this;
    }

    insert(payload: Linha): this {
        this.operacao = "insert";
        this.payload = payload;
        return this;
    }

    update(payload: Linha): this {
        this.operacao = "update";
        this.payload = payload;
        return this;
    }

    delete(): this {
        this.operacao = "delete";
        return this;
    }

    eq(coluna: string, valor: unknown): this {
        this.filtros.push((linha) => linha[coluna] === valor);
        return this;
    }

    // Aceita expressões no formato "coluna.ilike.%termo%,outra.ilike.%termo%"
    or(expressao: string): this {
        const condicoes: Array<{ coluna: string; termo: string }> = [];
        for (const parte of expressao.split(",")) {
            const encontrado = parte.match(/^([^.]+)\.ilike\.%(.*)%$/);
            if (encontrado) {
                condicoes.push({
                    coluna: encontrado[1] as string,
                    termo: (encontrado[2] as string).toLowerCase()
                });
            }
        }
        this.filtros.push((linha) =>
            condicoes.some((c) => String(linha[c.coluna] ?? "").toLowerCase().includes(c.termo))
        );
        return this;
    }

    order(coluna: string, opcoes?: { ascending?: boolean }): this {
        this.ordem = { coluna, asc: opcoes?.ascending !== false };
        return this;
    }

    single(): this {
        this.modo = "unico";
        return this;
    }

    maybeSingle(): this {
        this.modo = "talvez";
        return this;
    }

    then<R1 = Resultado, R2 = never>(
        onfulfilled?: ((valor: Resultado) => R1 | PromiseLike<R1>) | null,
        onrejected?: ((motivo: unknown) => R2 | PromiseLike<R2>) | null
    ): Promise<R1 | R2> {
        return Promise.resolve(this.executar()).then(onfulfilled, onrejected);
    }

    private executar(): Resultado {
        const linhas = this.banco.linhas(this.tabela);
        switch (this.operacao) {
            case "insert":
                return this.inserir(linhas);
            case "update":
                return this.atualizar(linhas);
            case "delete":
                return this.excluir(linhas);
            default:
                return this.responder(this.filtrar(linhas));
        }
    }

    private filtrar(linhas: Linha[]): Linha[] {
        return linhas.filter((linha) => this.filtros.every((filtro) => filtro(linha)));
    }

    private ordenar(linhas: Linha[]): Linha[] {
        if (!this.ordem) return linhas;
        const { coluna, asc } = this.ordem;
        return [...linhas].sort((a, b) => {
            const x = String(a[coluna] ?? "");
            const y = String(b[coluna] ?? "");
            return asc ? x.localeCompare(y) : y.localeCompare(x);
        });
    }

    private responder(encontradas: Linha[]): Resultado {
        const copia = this.ordenar(encontradas).map((linha) => ({ ...linha }));

        if (this.modo === "lista") {
            return { data: copia, error: null };
        }
        if (copia.length === 1) {
            return { data: copia[0], error: null };
        }
        if (copia.length === 0 && this.modo === "talvez") {
            return { data: null, error: null };
        }
        return { data: null, error: { code: "PGRST116", message: "Resultado diferente de uma linha" } };
    }

    private inserir(linhas: Linha[]): Resultado {
        const nova: Linha = { id: randomUUID(), ...this.payload };
        const erro = this.banco.validar(this.tabela, nova);
        if (erro) return { data: null, error: erro };

        linhas.push(nova);
        return this.retorna ? this.responder([nova]) : { data: null, error: null };
    }

    private atualizar(linhas: Linha[]): Resultado {
        const alvo = this.filtrar(linhas);

        for (const linha of alvo) {
            const atualizada = { ...linha, ...this.payload, id: linha.id };
            const erro = this.banco.validar(this.tabela, atualizada, linha);
            if (erro) return { data: null, error: erro };
        }

        for (const linha of alvo) {
            Object.assign(linha, this.payload);
        }
        return this.retorna ? this.responder(alvo) : { data: null, error: null };
    }

    private excluir(linhas: Linha[]): Resultado {
        const alvo = this.filtrar(linhas);

        if (alvo.some((linha) => this.banco.temFilhos(this.tabela, linha.id))) {
            return {
                data: null,
                error: { code: "23503", message: "Violação de chave estrangeira" }
            };
        }

        for (const linha of alvo) {
            linhas.splice(linhas.indexOf(linha), 1);
        }
        return this.retorna ? this.responder(alvo) : { data: null, error: null };
    }
}

class FakeSupabase {
    private tabelas = new Map<string, Linha[]>();

    from(tabela: string): Consulta {
        return new Consulta(this, tabela);
    }

    linhas(tabela: string): Linha[] {
        let linhas = this.tabelas.get(tabela);
        if (!linhas) {
            linhas = [];
            this.tabelas.set(tabela, linhas);
        }
        return linhas;
    }

    // Esvazia todas as tabelas (use no beforeEach)
    reset(): void {
        this.tabelas.clear();
    }

    // Insere linhas direto na "tabela" (gera id se não vier) e devolve as linhas criadas
    seed(tabela: string, novas: Linha[]): Linha[] {
        const criadas = novas.map((linha) => ({ id: randomUUID(), ...linha }));
        this.linhas(tabela).push(...criadas);
        return criadas.map((linha) => ({ ...linha }));
    }

    validar(tabela: string, linha: Linha, ignorar?: Linha): ErroBanco | null {
        for (const coluna of COLUNAS_UNICAS[tabela] ?? []) {
            const valor = linha[coluna];
            const repetido = this.linhas(tabela).some(
                (outra) => outra !== ignorar && valor != null && outra[coluna] === valor
            );
            if (repetido) {
                return { code: "23505", message: `Valor duplicado em ${coluna}` };
            }
        }

        for (const chave of CHAVES_ESTRANGEIRAS.filter((c) => c.tabela === tabela)) {
            const valor = linha[chave.coluna];
            const existe = this.linhas(chave.referencia).some((pai) => pai.id === valor);
            if (valor != null && !existe) {
                return { code: "23503", message: `${chave.coluna} não existe em ${chave.referencia}` };
            }
        }

        return null;
    }

    temFilhos(tabela: string, id: unknown): boolean {
        return CHAVES_ESTRANGEIRAS.filter((c) => c.referencia === tabela).some((chave) =>
            this.linhas(chave.tabela).some((filho) => filho[chave.coluna] === id)
        );
    }
}

export const fakeSupabase = new FakeSupabase();