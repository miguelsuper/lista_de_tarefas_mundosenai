
const inputTarefa = document.getElementById('input-tarefa');
const btnAdicionar = document.getElementById('btn-adicionar');
const listaTarefas = document.getElementById('lista-tarefas');

function adicionarTarefa() {
    const texto = inputTarefa.value.trim();

    if (texto === '') {
        alert('Digite uma tarefa primeiro!');
        inputTarefa.focus();
        return;
    }

    // Cria o bloco da tarefa
    const novaTarefa = document.createElement('li');
    novaTarefa.classList.add('tarefa');

    // Cria o checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    // Cria o texto da tarefa
    const textoTarefa = document.createElement('span');
    textoTarefa.innerText = texto;

    // Marca a tarefa como concluída
    checkbox.addEventListener('change', function () {
        textoTarefa.classList.toggle('concluida', checkbox.checked);
    });

    // Cria o botão de excluir
    const btnExcluir = document.createElement('button');
    btnExcluir.innerText = '🗑';
    btnExcluir.classList.add('btn-excluir');
    btnExcluir.setAttribute('aria-label', 'Excluir tarefa');

    btnExcluir.addEventListener('click', function () {
        novaTarefa.remove();
    });

    // Junta os elementos
    novaTarefa.appendChild(checkbox);
    novaTarefa.appendChild(textoTarefa);
    novaTarefa.appendChild(btnExcluir);

    listaTarefas.appendChild(novaTarefa);

    inputTarefa.value = '';
    inputTarefa.focus();
}

// Adiciona pelo botão
btnAdicionar.addEventListener('click', adicionarTarefa);

// Adiciona apertando Enter
inputTarefa.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter') {
        adicionarTarefa();
    }
});