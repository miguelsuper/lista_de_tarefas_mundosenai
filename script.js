
const CHAVE = "minhas-tarefas-notas-v1";

const $ = (seletor) => document.querySelector(seletor);

function idNovo() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8);
}

function dadosIniciais() {
    return {
        pastas: [
            { id: "estudos", nome: "Estudos", cor: "grafite" },
            { id: "projetos", nome: "Projetos", cor: "cinza" },
            { id: "pessoal", nome: "Pessoal", cor: "preto" }
        ],
        tarefas: []
    };
}

function carregar() {
    try {
        const salvo = localStorage.getItem(CHAVE);

        if (salvo) {
            const dados = JSON.parse(salvo);

            if (
                Array.isArray(dados.pastas) &&
                Array.isArray(dados.tarefas)
            ) {
                dados.pastas = dados.pastas.filter(
                    p => p && p.id && p.nome
                );

                dados.tarefas = dados.tarefas.filter(
                    t => t && t.id &&
                    typeof t.texto === "string" &&
                    typeof t.concluida === "boolean"
                );

                return dados;
            }
        }
    } catch (erro) {
        console.warn("Não foi possível carregar os dados.", erro);
    }

    return dadosIniciais();
}

let dados = carregar();
let listaAtual = "todas";
let pastaAtual = null;
let tarefaEditando = null;

function salvar() {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(dados));
        return true;
    } catch (erro) {
        alert("Não foi possível salvar os dados neste navegador.");
        return false;
    }
}

function pastaPorId(id) {
    return dados.pastas.find(p => p.id === id);
}

function tarefasVisiveis() {
    if (listaAtual === "todas") {
        return dados.tarefas;
    }

    if (listaAtual === "hoje") {
        return dados.tarefas.filter(t => !t.concluida);
    }

    if (listaAtual === "importantes") {
        return dados.tarefas.filter(t => t.importante);
    }

    return dados.tarefas.filter(t => t.pastaId === pastaAtual);
}

function atualizarTitulo() {
    const titulos = {
        todas: ["Todas", "Suas tarefas em um só lugar"],
        hoje: ["Hoje", "Tarefas que ainda precisam da sua atenção"],
        importantes: ["Importantes", "Tarefas marcadas com estrela"]
    };

    let titulo;
    let resumo;

    if (pastaAtual) {
        const pasta = pastaPorId(pastaAtual);
        titulo = pasta ? pasta.nome : "Minhas Tarefas";

        const quantidade = tarefasVisiveis().length;
        resumo = `${quantidade} ${quantidade === 1 ? "tarefa" : "tarefas"}`;
    } else {
        [titulo, resumo] = titulos[listaAtual] || titulos.todas;
    }

    $("#titulo-lista").textContent = titulo;
    $("#resumo-lista").textContent = resumo;
}

function renderizarMenu() {
    $("#count-todas").textContent = dados.tarefas.length;

    $("#count-hoje").textContent =
        dados.tarefas.filter(t => !t.concluida).length;

    $("#count-importantes").textContent =
        dados.tarefas.filter(t => t.importante).length;

    document.querySelectorAll("[data-lista]").forEach(botao => {
        botao.classList.toggle(
            "selecionado",
            !pastaAtual && botao.dataset.lista === listaAtual
        );
    });

    const nav = $("#lista-pastas");
    nav.replaceChildren();

    dados.pastas.forEach(pasta => {
       
const item = document.createElement("div");
item.className = "pasta-linha";

const botao = document.createElement("button");
botao.type = "button";
botao.className = "pasta-item";

if (pastaAtual === pasta.id) {
    botao.classList.add("selecionado");
}

const icone = document.createElement("span");
icone.className = `icone-pasta ${pasta.cor || "grafite"}`;

const nome = document.createElement("span");
nome.className = "pasta-nome";
nome.textContent = pasta.nome;

const contagem = document.createElement("span");
contagem.className = "pasta-contagem";
contagem.textContent = dados.tarefas.filter(
    t => t.pastaId === pasta.id
).length;

botao.append(icone, nome, contagem);

botao.addEventListener("click", () => {
    pastaAtual = pasta.id;
    listaAtual = "pasta";
    renderizar();
});

const lixeira = document.createElement("button");
lixeira.type = "button";
lixeira.className = "pasta-excluir";
lixeira.textContent = "🗑";
lixeira.title = `Excluir pasta ${pasta.nome}`;
lixeira.setAttribute("aria-label", `Excluir pasta ${pasta.nome}`);

lixeira.addEventListener("click", (evento) => {
    evento.stopPropagation();

    const quantidade = dados.tarefas.filter(
        t => t.pastaId === pasta.id
    ).length;

    const mensagem = quantidade > 0
        ? `Excluir a pasta "${pasta.nome}" e suas ${quantidade} tarefa(s)?`
        : `Excluir a pasta "${pasta.nome}"?`;

    if (!confirm(mensagem)) return;

    const pastasAnteriores = [...dados.pastas];
    const tarefasAnteriores = [...dados.tarefas];

    dados.pastas = dados.pastas.filter(p => p.id !== pasta.id);
    dados.tarefas = dados.tarefas.filter(t => t.pastaId !== pasta.id);

    if (!salvar()) {
        dados.pastas = pastasAnteriores;
        dados.tarefas = tarefasAnteriores;
        return;
    }

    if (pastaAtual === pasta.id) {
        pastaAtual = null;
        listaAtual = "todas";
    }

    renderizar();
});

item.append(botao, lixeira);
nav.appendChild(item);
    });
}

function renderizarTarefas() {
    const container = $("#tarefas");
    container.replaceChildren();

    const tarefas = tarefasVisiveis();

    $("#mensagem-vazia").classList.toggle(
        "visivel",
        tarefas.length === 0
    );

    if (listaAtual === "importantes") {
        $("#mensagem-vazia").textContent =
            "Nenhuma tarefa importante. Marque uma tarefa com estrela para encontrá-la aqui.";
    } else {
        $("#mensagem-vazia").textContent =
            "Sua lista está vazia. Adicione uma tarefa para começar.";
    }

    tarefas.forEach(tarefa => {
        const linha = document.createElement("div");
        linha.className = "tarefa";

        if (tarefa.concluida) {
            linha.classList.add("concluida");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = tarefa.concluida;
        checkbox.setAttribute("aria-label", `Concluir ${tarefa.texto}`);

        
        checkbox.addEventListener("change", () => {
        tarefa.concluida = checkbox.checked;

        salvar();

        linha.classList.toggle("concluida", tarefa.concluida);

        renderizarMenu();
        atualizarTitulo();
        });

        const texto = document.createElement("span");
        texto.className = "tarefa-texto";
        texto.textContent = tarefa.texto;

        const acoes = document.createElement("div");
        acoes.className = "tarefa-acoes";

        const importante = document.createElement("button");
        importante.type = "button";
        importante.textContent = tarefa.importante ? "★" : "☆";
        importante.title = tarefa.importante
            ? "Remover dos importantes"
            : "Marcar como importante";

        importante.addEventListener("click", () => {
            tarefa.importante = !tarefa.importante;
            salvar();
            renderizar();
        });

        const editar = document.createElement("button");
        editar.type = "button";
        editar.textContent = "Editar";
        editar.addEventListener("click", () => abrirEditar(tarefa.id));

        const excluir = document.createElement("button");
        excluir.type = "button";
        excluir.textContent = "Excluir";

        excluir.addEventListener("click", () => {
            if (!confirm(`Excluir a tarefa "${tarefa.texto}"?`)) {
                return;
            }

            dados.tarefas = dados.tarefas.filter(
                t => t.id !== tarefa.id
            );

            salvar();
            renderizar();
        });

        acoes.append(importante, editar, excluir);
        linha.append(checkbox, texto, acoes);
        container.appendChild(linha);
    });
}

function renderizar() {
    renderizarMenu();
    atualizarTitulo();
    renderizarTarefas();
}

document.querySelectorAll("[data-lista]").forEach(botao => {
    botao.addEventListener("click", () => {
        listaAtual = botao.dataset.lista;
        pastaAtual = null;
        renderizar();
    });
});

$("#form-rapido").addEventListener("submit", evento => {
    evento.preventDefault();

    const campo = $("#nova-tarefa");
    const texto = campo.value.trim();

    if (!texto) {
        campo.focus();
        return;
    }

    if (dados.pastas.length === 0) {
        alert("Crie uma pasta antes de adicionar uma tarefa.");
        $("#modal-pasta").showModal();
        return;
    }

    const pastaId = pastaAtual || dados.pastas[0].id;

    const tarefa = {
        id: idNovo(),
        texto,
        pastaId,
        concluida: false,
        importante: false,
        criadaEm: new Date().toISOString()
    };

    dados.tarefas.push(tarefa);

    if (!salvar()) {
        dados.tarefas = dados.tarefas.filter(
            t => t.id !== tarefa.id
        );
        return;
    }

    campo.value = "";
    renderizar();
    campo.focus();
});

$("#adicionar-pasta").addEventListener("click", () => {
    $("#form-pasta").reset();
    $("#modal-pasta").showModal();
    $("#nome-pasta").focus();
});

$("#form-pasta").addEventListener("submit", evento => {
    evento.preventDefault();

    const nome = $("#nome-pasta").value.trim();
    const cor = $("#cor-pasta").value;

    if (!nome) return;

    if (dados.pastas.some(
        p => p.nome.toLowerCase() === nome.toLowerCase()
    )) {
        alert("Já existe uma pasta com esse nome.");
        return;
    }

    const pasta = {
        id: idNovo(),
        nome,
        cor
    };

    dados.pastas.push(pasta);

    if (!salvar()) {
        dados.pastas = dados.pastas.filter(
            p => p.id !== pasta.id
        );
        return;
    }

    $("#modal-pasta").close();

    pastaAtual = pasta.id;
    listaAtual = "pasta";

    renderizar();
});

function abrirEditar(id) {
    const tarefa = dados.tarefas.find(t => t.id === id);

    if (!tarefa) return;

    tarefaEditando = id;
    $("#editar-titulo").value = tarefa.texto;

    const select = $("#editar-pasta");
    select.replaceChildren();

    dados.pastas.forEach(pasta => {
        const option = document.createElement("option");
        option.value = pasta.id;
        option.textContent = pasta.nome;
        select.appendChild(option);
    });

    select.value = tarefa.pastaId;
    $("#modal-editar").showModal();
}

$("#form-editar").addEventListener("submit", evento => {
    evento.preventDefault();

    const tarefa = dados.tarefas.find(
        t => t.id === tarefaEditando
    );

    if (!tarefa) return;

    const tituloAnterior = tarefa.texto;
    const pastaAnterior = tarefa.pastaId;

    tarefa.texto = $("#editar-titulo").value.trim();
    tarefa.pastaId = $("#editar-pasta").value;

    if (!tarefa.texto) return;

    if (!salvar()) {
        tarefa.texto = tituloAnterior;
        tarefa.pastaId = pastaAnterior;
        return;
    }

    $("#modal-editar").close();
    tarefaEditando = null;

    renderizar();
});

document.querySelectorAll("[data-fechar]").forEach(botao => {
    botao.addEventListener("click", () => {
        botao.closest("dialog").close();
    });
});

renderizar();