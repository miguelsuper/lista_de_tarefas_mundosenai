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

// Carrega os dados salvos sem apagar as tarefas existentes.
function carregar() {
    try {
        const salvo = localStorage.getItem(CHAVE);

        if (salvo) {
            const dadosSalvos = JSON.parse(salvo);

            if (
                Array.isArray(dadosSalvos.pastas) &&
                Array.isArray(dadosSalvos.tarefas)
            ) {
                dadosSalvos.pastas = dadosSalvos.pastas.filter(
                    p => p && p.id && p.nome
                );

                dadosSalvos.tarefas = dadosSalvos.tarefas.filter(
                    t => t && t.id &&
                    typeof t.texto === "string" &&
                    typeof t.concluida === "boolean"
                );

                return dadosSalvos;
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

// Salva os dados no navegador.
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

// Calcula o status do prazo usando a data local do computador.
function calcularPrazo(data) {
    if (!data) return null;

    const [ano, mes, dia] = data.split("-").map(Number);

    const prazo = Date.UTC(ano, mes - 1, dia);

    const agora = new Date();

    const hoje = Date.UTC(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
    );

    const dias = Math.round((prazo - hoje) / 86400000);

    if (dias < 0) {
        return { texto: "Vencido", classe: "vencido" };
    }

    if (dias === 0) {
        return { texto: "Vence hoje", classe: "hoje" };
    }

    if (dias === 1) {
        return { texto: "Último dia", classe: "ultimo-dia" };
    }

    if (dias <= 7) {
        return { texto: "Perto", classe: "perto" };
    }

    return { texto: "Longe", classe: "longe" };
}

// Retorna as tarefas que devem aparecer na lista atual.
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

// Atualiza o título e o subtítulo da lista.
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

        resumo = `${quantidade} ${
            quantidade === 1 ? "tarefa" : "tarefas"
        }`;
    } else {
        [titulo, resumo] = titulos[listaAtual] || titulos.todas;
    }

    $("#titulo-lista").textContent = titulo;
    $("#resumo-lista").textContent = resumo;
}

// Atualiza o menu lateral e as pastas.
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

        nav.appendChild(botao);
    });
}

// Renderiza as tarefas e seus indicadores de prazo.
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

        // Caixa para concluir a tarefa.
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = tarefa.concluida;

        checkbox.setAttribute(
            "aria-label",
            `Concluir ${tarefa.texto}`
        );

        checkbox.addEventListener("change", () => {
            const estadoAnterior = tarefa.concluida;

            tarefa.concluida = checkbox.checked;

            if (!salvar()) {
                tarefa.concluida = estadoAnterior;
                checkbox.checked = estadoAnterior;
                return;
            }

            renderizar();
        });

        // Texto da tarefa.
        const texto = document.createElement("span");

        texto.className = "tarefa-texto";
        texto.textContent = tarefa.texto;

        linha.append(checkbox, texto);

        // Indicador do prazo.
        if (tarefa.prazo) {
            const indicador = document.createElement("span");

            indicador.className = "indicador-prazo";

            if (tarefa.concluida) {
                indicador.textContent = "Concluída";
                indicador.classList.add("concluida-prazo");
            } else {
                const status = calcularPrazo(tarefa.prazo);

                indicador.textContent = status.texto;
                indicador.classList.add(status.classe);

                const dataFormatada = tarefa.prazo
                    .split("-")
                    .reverse()
                    .join("/");

                indicador.title = `Prazo: ${dataFormatada}`;
            }

            linha.appendChild(indicador);
        }

        // Botões de ação.
        const acoes = document.createElement("div");

        acoes.className = "tarefa-acoes";

        // Marcar como importante.
        const importante = document.createElement("button");

        importante.type = "button";
        importante.textContent = tarefa.importante ? "★" : "☆";

        importante.title = tarefa.importante
            ? "Remover dos importantes"
            : "Marcar como importante";

        importante.addEventListener("click", () => {
            const anterior = tarefa.importante;

            tarefa.importante = !tarefa.importante;

            if (!salvar()) {
                tarefa.importante = anterior;
                return;
            }

            renderizar();
        });

        // Editar a tarefa.
        const editar = document.createElement("button");

        editar.type = "button";
        editar.textContent = "Editar";

        editar.addEventListener("click", () => {
            abrirEditar(tarefa.id);
        });

        // Excluir a tarefa.
        const excluir = document.createElement("button");

        excluir.type = "button";
        excluir.textContent = "Excluir";

        excluir.addEventListener("click", () => {
            if (!confirm(`Excluir a tarefa "${tarefa.texto}"?`)) {
                return;
            }

            const tarefasAnteriores = [...dados.tarefas];

            dados.tarefas = dados.tarefas.filter(
                t => t.id !== tarefa.id
            );

            if (!salvar()) {
                dados.tarefas = tarefasAnteriores;
                return;
            }

            renderizar();
        });

        acoes.append(importante, editar, excluir);

        linha.appendChild(acoes);

        container.appendChild(linha);
    });
}

// Atualiza toda a interface.
function renderizar() {
    renderizarMenu();
    atualizarTitulo();
    renderizarTarefas();
}

// Navegação pelas listas do menu.
document.querySelectorAll("[data-lista]").forEach(botao => {
    botao.addEventListener("click", () => {
        listaAtual = botao.dataset.lista;
        pastaAtual = null;

        renderizar();
    });
});

// Adicionar uma tarefa.
$("#form-rapido").addEventListener("submit", evento => {
    evento.preventDefault();

    const campo = $("#nova-tarefa");
    const texto = campo.value.trim();

    const campoPrazo = $("#prazo-tarefa");
    const prazo = campoPrazo ? campoPrazo.value : "";

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
        criadaEm: new Date().toISOString(),
        prazo: prazo || ""
    };

    dados.tarefas.push(tarefa);

    if (!salvar()) {
        dados.tarefas = dados.tarefas.filter(
            t => t.id !== tarefa.id
        );

        return;
    }

    campo.value = "";

    if (campoPrazo) {
        campoPrazo.value = "";
    }

    renderizar();

    campo.focus();
});

// Abrir o formulário para criar uma pasta.
$("#adicionar-pasta").addEventListener("click", () => {
    $("#form-pasta").reset();

    $("#modal-pasta").showModal();

    $("#nome-pasta").focus();
});

// Criar uma pasta.
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

// Abrir a janela de edição.
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

// Salvar as alterações da tarefa.
$("#form-editar").addEventListener("submit", evento => {
    evento.preventDefault();

    const tarefa = dados.tarefas.find(
        t => t.id === tarefaEditando
    );

    if (!tarefa) return;

    const tituloNovo = $("#editar-titulo").value.trim();
    const pastaNova = $("#editar-pasta").value;

    if (!tituloNovo) {
        alert("Digite um título para a tarefa.");
        $("#editar-titulo").focus();
        return;
    }

    const tituloAnterior = tarefa.texto;
    const pastaAnterior = tarefa.pastaId;

    tarefa.texto = tituloNovo;
    tarefa.pastaId = pastaNova;

    if (!salvar()) {
        tarefa.texto = tituloAnterior;
        tarefa.pastaId = pastaAnterior;
        return;
    }

    $("#modal-editar").close();

    tarefaEditando = null;

    renderizar();
});

// Botões para fechar as janelas.
document.querySelectorAll("[data-fechar]").forEach(botao => {
    botao.addEventListener("click", () => {
        botao.closest("dialog").close();
    });
});

// Menu de opções da pasta atual.
$("#menu-pasta").addEventListener("click", () => {
    if (!pastaAtual) {
        alert("Abra uma pasta para ver as opções dela.");
        return;
    }

    const pasta = pastaPorId(pastaAtual);

    if (!pasta) return;

    const acao = prompt(
        `Pasta "${pasta.nome}"\n\n1 - Renomear\n2 - Excluir`
    );

    // Renomear pasta.
    if (acao === "1") {
        const nome = prompt(
            "Novo nome da pasta:",
            pasta.nome
        );

        if (!nome || !nome.trim()) return;

        const novoNome = nome.trim();

        if (dados.pastas.some(
            p => p.id !== pasta.id &&
            p.nome.toLowerCase() === novoNome.toLowerCase()
        )) {
            alert("Já existe uma pasta com esse nome.");
            return;
        }

        const anterior = pasta.nome;

        pasta.nome = novoNome;

        if (!salvar()) {
            pasta.nome = anterior;
            return;
        }

        renderizar();
    }

    // Excluir pasta.
    if (acao === "2") {
        if (!confirm(
            `Excluir "${pasta.nome}" e todas as tarefas dela?`
        )) {
            return;
        }

        const pastasAnteriores = [...dados.pastas];
        const tarefasAnteriores = [...dados.tarefas];

        dados.pastas = dados.pastas.filter(
            p => p.id !== pasta.id
        );

        dados.tarefas = dados.tarefas.filter(
            t => t.pastaId !== pasta.id
        );

        if (!salvar()) {
            dados.pastas = pastasAnteriores;
            dados.tarefas = tarefasAnteriores;
            return;
        }

        pastaAtual = null;
        listaAtual = "todas";

        renderizar();
    }
});

// Mostrar a interface inicial.
renderizar();