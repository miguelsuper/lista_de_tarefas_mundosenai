const btnCriarBloco = document.getElementById('btn-criar-bloco');
const containerBlocos = document.getElementById('container-blocos');

function criarBloco() {
    const nomeBloco = prompt('Digite o nome do bloco:');
    
    if (!nomeBloco || nomeBloco.trim() === '') {
        alert('Você precisa dar um nome para o bloco!');
        return;
    }

    const divBloco = document.createElement('div');
    divBloco.classList.add('bloco-tarefa');

    const tituloBloco = document.createElement('h2');
    tituloBloco.innerText = nomeBloco;

    // --- AQUI ENTRA A MÁGICA DA COR ---
    const labelCor = document.createElement('label');
    labelCor.innerText = ' Cor do bloco: ';
    
    const inputCor = document.createElement('input');
    inputCor.type = 'color';
    inputCor.value = '#ffffff'; // Começa branco

    // Evento que muda a cor do fundo do bloco quando você escolhe uma cor
    inputCor.addEventListener('input', function() {
        divBloco.style.backgroundColor = inputCor.value;
    });
    // ----------------------------------

    const inputTarefa = document.createElement('input');
    inputTarefa.type = 'text';
    inputTarefa.placeholder = 'Digite uma tarefa...';

    const btnAdicionar = document.createElement('button');
    btnAdicionar.innerText = 'Adicionar';

    const listaTarefas = document.createElement('ul');

    const btnExcluirBloco = document.createElement('button');
    btnExcluirBloco.innerText = '🗑 Excluir Bloco';
    btnExcluirBloco.classList.add('btn-excluir-bloco');

    btnAdicionar.addEventListener('click', function() {
        const texto = inputTarefa.value;

        if (texto.trim() === '') {
            alert('Digite uma tarefa primeiro!');
            return;
        }

        const novaTarefa = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        const spanTexto = document.createElement('span');
        spanTexto.innerText = texto;

        const btnExcluir = document.createElement('button');
        btnExcluir.innerText = '🗑';

        novaTarefa.appendChild(checkbox);
        novaTarefa.appendChild(spanTexto);
        novaTarefa.appendChild(btnExcluir);
        listaTarefas.appendChild(novaTarefa);

        btnExcluir.addEventListener('click', function() {
            novaTarefa.remove();
        });

        inputTarefa.value = '';
    });

    btnExcluirBloco.addEventListener('click', function() {
        if (confirm(`Tem certeza que deseja apagar o bloco "${nomeBloco}"?`)) {
            divBloco.remove();
        }
    });

    // Adicionando tudo na ordem certa dentro do bloco
    divBloco.appendChild(tituloBloco);
    divBloco.appendChild(labelCor);
    divBloco.appendChild(inputCor);
    divBloco.appendChild(document.createElement('br')); // Só pra dar uma quebradinha de linha
    divBloco.appendChild(document.createElement('br'));
    divBloco.appendChild(inputTarefa);
    divBloco.appendChild(btnAdicionar);
    divBloco.appendChild(listaTarefas);
    divBloco.appendChild(btnExcluirBloco);

    containerBlocos.appendChild(divBloco);
}

btnCriarBloco.addEventListener('click', criarBloco);