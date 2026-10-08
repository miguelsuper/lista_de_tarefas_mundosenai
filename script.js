
const inputTarefa = document.getElementById('input-tarefa');
const btnAdicionar = document.getElementById('btn-adicionar');
const listaTarefas = document.getElementById('lista-tarefas');


function adicionarTarefa() {

  const texto = inputTarefa.value;


  if (texto === '') {
    alert('Digite uma tarefa primeiro!');
    return;
  }

  const novatarefa = document.createElement('p');
  const checkbox = document.createElement('input');
  const btnExcluir = document.createElement('button');

  checkbox.type = 'checkbox';

  novatarefa.innerText = texto;
  listaTarefas.appendChild(novatarefa);
  novatarefa.appendChild(checkbox);
  novatarefa.appendChild(btnExcluir);
  btnExcluir.innerText = "🗑";
 
    btnExcluir.addEventListener('click', function() {
        novatarefa.remove();
    });

  inputTarefa.value = '';
}

btnAdicionar.addEventListener('click', adicionarTarefa);
