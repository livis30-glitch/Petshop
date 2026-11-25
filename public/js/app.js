var entidades = {
    clientes: {
        titulo: "Clientes",
        rota: "/clientes",
        campos: [
            { nome: "nome", rotulo: "Nome", tipo: "text" },
            { nome: "email", rotulo: "E-mail", tipo: "email" },
            { nome: "telefone", rotulo: "Telefone com DDD", tipo: "text" },
            { nome: "activo", rotulo: "Ativo", tipo: "checkbox" }
        ]
    },
    pets: {
        titulo: "Pets",
        rota: "/pets",
        campos: [
            { nome: "cliente_id", rotulo: "Dono", tipo: "select", fonte: "clientes" },
            { nome: "nome", rotulo: "Nome", tipo: "text" },
            { nome: "especie", rotulo: "Espécie", tipo: "text" },
            { nome: "raca", rotulo: "Raça", tipo: "text" },
            { nome: "idade", rotulo: "Idade", tipo: "number" },
            { nome: "activo", rotulo: "Ativo", tipo: "checkbox" }
        ]
    },
    agendamentos: {
        titulo: "Agendamentos",
        rota: "/agendamentos",
        campos: [
            { nome: "cliente_id", rotulo: "Cliente", tipo: "select", fonte: "clientes" },
            { nome: "pet_id", rotulo: "Pet", tipo: "select", fonte: "pets" },
            { nome: "data_hora", rotulo: "Data e hora", tipo: "datetime-local" },
            { nome: "servico", rotulo: "Serviço", tipo: "text" },
            { nome: "observacoes", rotulo: "Observações (opcional)", tipo: "text", opcional: true }
        ],
        extras: [{ nome: "status", rotulo: "Status" }]
    }
};

var atual = "clientes";
var editandoId = "";
var lista = [];
var cache = { clientes: [], pets: [] };

function esc(texto) {
    return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pedir(metodo, url, corpo) {
    var opcoes = { method: metodo, headers: { "Content-Type": "application/json" } };
    if (corpo) { opcoes.body = JSON.stringify(corpo); }
    return fetch(url, opcoes).then(function (resposta) {
        return resposta.json().then(function (dados) {
            if (!resposta.ok) { throw new Error(dados.error || "Erro ao falar com a API."); }
            return dados;
        });
    });
}

function mostrarMensagem(texto, tipo) {
    document.getElementById("mensagem").innerHTML = texto ? '<div class="msg ' + tipo + '">' + esc(texto) + "</div>" : "";
}

function abrirAba(chave) {
    atual = chave;
    var chaves = ["clientes", "pets", "agendamentos"];
    for (var i = 0; i < chaves.length; i++) {
        document.getElementById("aba_" + chaves[i]).className = chaves[i] === chave ? "ativa" : "";
    }
    document.getElementById("titulo").innerHTML = entidades[chave].titulo;
    document.getElementById("busca").value = "";
    mostrarMensagem("", "");
    carregarCache().then(function () {
        limparFormulario();
        listar("");
    });
}

function carregarCache() {
    return pedir("GET", "/clientes").then(function (c) {
        cache.clientes = c;
        return pedir("GET", "/pets");
    }).then(function (p) {
        cache.pets = p;
    }).catch(function (erro) {
        mostrarMensagem(erro.message, "erro");
    });
}

function opcoes(fonte) {
    var html = '<option value="">Selecione</option>';
    for (var i = 0; i < cache[fonte].length; i++) {
        html += '<option value="' + cache[fonte][i].id + '">' + esc(cache[fonte][i].nome) + "</option>";
    }
    return html;
}

function montarFormulario() {
    var campos = entidades[atual].campos;
    var html = "";
    for (var i = 0; i < campos.length; i++) {
        var c = campos[i];
        html += '<div class="campo"><label for="f_' + c.nome + '">' + c.rotulo + "</label>";
        if (c.tipo === "select") {
            html += '<select id="f_' + c.nome + '">' + opcoes(c.fonte) + "</select>";
        } else if (c.tipo === "checkbox") {
            html += '<input type="checkbox" id="f_' + c.nome + '" checked>';
        } else {
            html += '<input type="' + c.tipo + '" id="f_' + c.nome + '">';
        }
        html += "</div>";
    }
    document.getElementById("campos").innerHTML = html;
}

function limparFormulario() {
    editandoId = "";
    montarFormulario();
    document.getElementById("btnSalvar").innerHTML = "Salvar";
    document.getElementById("btnCancelar").innerHTML = "Limpar";
}

function lerFormulario() {
    var campos = entidades[atual].campos;
    var dados = {};
    for (var i = 0; i < campos.length; i++) {
        var c = campos[i];
        var el = document.getElementById("f_" + c.nome);
        if (c.tipo === "checkbox") {
            dados[c.nome] = el.checked;
        } else if (c.tipo === "number") {
            dados[c.nome] = el.value === "" ? "" : Number(el.value);
        } else if (c.tipo === "datetime-local") {
            dados[c.nome] = el.value === "" ? "" : new Date(el.value).toISOString();
        } else {
            dados[c.nome] = el.value.trim();
        }
        if (dados[c.nome] === "" && !c.opcional) {
            mostrarMensagem("Preencha o campo: " + c.rotulo + ".", "erro");
            return null;
        }
    }
    return dados;
}

function salvar() {
    var dados = lerFormulario();
    if (!dados) { return; }
    var rota = entidades[atual].rota;
    var requisicao = editandoId ? pedir("PUT", rota + "/" + editandoId, dados) : pedir("POST", rota, dados);
    requisicao.then(function () {
        mostrarMensagem(editandoId ? "Registro atualizado." : "Registro cadastrado.", "ok");
        return carregarCache();
    }).then(function () {
        limparFormulario();
        listar("");
    }).catch(function (erro) {
        mostrarMensagem(erro.message, "erro");
    });
}

function buscar() {
    listar(document.getElementById("busca").value.trim());
}

function listar(palavra) {
    var rota = entidades[atual].rota;
    var url = palavra ? rota + "/search/" + encodeURIComponent(palavra) : rota;
    pedir("GET", url).then(function (dados) {
        lista = dados;
        desenharTabela();
    }).catch(function (erro) {
        mostrarMensagem(erro.message, "erro");
    });
}

function nomePorId(fonte, id) {
    for (var i = 0; i < cache[fonte].length; i++) {
        if (cache[fonte][i].id === id) { return cache[fonte][i].nome; }
    }
    return id;
}

function formatar(campo, valor) {
    if (valor === null || valor === undefined || valor === "") { return "-"; }
    if (campo.tipo === "select") { return esc(nomePorId(campo.fonte, valor)); }
    if (campo.tipo === "checkbox") { return valor ? "Sim" : "Não"; }
    if (campo.tipo === "datetime-local") { return new Date(valor).toLocaleString("pt-BR"); }
    return esc(valor);
}

function desenharTabela() {
    var e = entidades[atual];
    if (lista.length === 0) {
        document.getElementById("tabela").innerHTML = '<div class="vazio">Nenhum registro encontrado. Use o formulário acima para cadastrar.</div>';
        return;
    }
    var html = "<table><tr>";
    for (var i = 0; i < e.campos.length; i++) { html += "<th>" + e.campos[i].rotulo + "</th>"; }
    if (e.extras) { html += "<th>Status</th>"; }
    html += "<th>Ações</th></tr>";
    for (var j = 0; j < lista.length; j++) {
        var item = lista[j];
        html += "<tr>";
        for (var k = 0; k < e.campos.length; k++) { html += "<td>" + formatar(e.campos[k], item[e.campos[k].nome]) + "</td>"; }
        if (e.extras) { html += "<td>" + esc(item.status) + "</td>"; }
        html += '<td><button class="mini" onclick="editar(\'' + item.id + '\')">Editar</button>';
        if (atual === "agendamentos" && item.status === "agendado") {
            html += '<button class="mini ok" onclick="mudarStatus(\'' + item.id + '\', \'concluido\')">Concluir</button>';
            html += '<button class="mini sec" onclick="mudarStatus(\'' + item.id + '\', \'cancelado\')">Cancelar</button>';
        }
        html += '<button class="mini perigo" onclick="excluir(\'' + item.id + '\')">Excluir</button></td></tr>';
    }
    html += "</table>";
    document.getElementById("tabela").innerHTML = html;
}

function paraInputData(iso) {
    var d = new Date(iso);
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
}

function editar(id) {
    var campos = entidades[atual].campos;
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].id !== id) { continue; }
        editandoId = id;
        for (var j = 0; j < campos.length; j++) {
            var c = campos[j];
            var el = document.getElementById("f_" + c.nome);
            var valor = lista[i][c.nome];
            if (c.tipo === "checkbox") { el.checked = valor; }
            else if (c.tipo === "datetime-local") { el.value = paraInputData(valor); }
            else { el.value = valor === null ? "" : valor; }
        }
        document.getElementById("btnSalvar").innerHTML = "Atualizar";
        document.getElementById("btnCancelar").innerHTML = "Cancelar edição";
        mostrarMensagem("Editando o registro selecionado.", "ok");
        window.scrollTo(0, 0);
    }
}

function excluir(id) {
    if (!confirm("Deseja excluir este registro?")) { return; }
    pedir("DELETE", entidades[atual].rota + "/" + id).then(function (dados) {
        mostrarMensagem(dados.mensagem || "Registro excluído.", "ok");
        return carregarCache();
    }).then(function () {
        limparFormulario();
        listar("");
    }).catch(function (erro) {
        mostrarMensagem(erro.message, "erro");
    });
}

function mudarStatus(id, status) {
    pedir("PATCH", "/agendamentos/" + id + "/status", { status: status }).then(function () {
        mostrarMensagem("Status alterado para " + status + ".", "ok");
        listar("");
    }).catch(function (erro) {
        mostrarMensagem(erro.message, "erro");
    });
}

abrirAba("clientes");