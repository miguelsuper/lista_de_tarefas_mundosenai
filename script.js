const CORES = [
  { id: 'vermelho', hex: '#ff4757' },
  { id: 'laranja', hex: '#ff7f50' },
  { id: 'amarelo', hex: '#ffa500' },
  { id: 'verde', hex: '#2ed573' },
  { id: 'azul', hex: '#1e90ff' },
  { id: 'roxo', hex: '#9b59b6' }
];

let corSelecionada = CORES[0].hex;
let blocos = [];

window.onload = function() {
  carregarDados();
  montarSeletorCores();
  configurarEventos();
  renderizar();
};

function salvarDados() {
  localStorage.setItem('organize_blocos', JSON.stringify(blocos));
}

function carregarDados() {
  const dadosSalvos = localStorage.getItem('organize_blocos');
  if (dadosSalvos) {
    blocos = JSON.parse(dadosSalvos);
  }
}

function montarSeletorCores() {
  const container = document.getElementById('colorPicker');
  container.innerHTML = '';

  CORES.forEach((cor, index) => {
    const btn = document.createElement('div');
    btn.className = 'color-btn' + (index === 0 ? ' selected' : '');
    btn.style.backgroundColor = cor.hex;

    btn.onclick = function() {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      corSelecionada = cor.hex;
    };

    container.appendChild(btn);
  });
}

function configurarEventos() {
  document.getElementById('btnCreateBlock').onclick = criarBloco;
  
  document.getElementById('filterYear').onchange = renderizar;
  document.getElementById('filterMonth').onchange = renderizar;
  document.getElementById('filterDay').oninput = renderizar;
  
  document.getElementById('btnClearFilters').onclick = function() {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterDay').value = '';
    renderizar();
  };
}

function criarBloco() {
  const input = document.getElementById('blockTitleInput');
  const titulo = input.value.trim();

  if (!titulo) return;

  const novoBloco = {
    id: Date.now(),
    titulo: titulo,
    cor: corSelecionada,
    tarefas: []
  };

  blocos.push(novoBloco);
  salvarDados();
  input.value = '';
  renderizar();
}

function deletarBloco(idBloco) {
  blocos = blocos.filter(b => b.id !== idBloco);
  salvarDados();
  renderizar();
}

function adicionarTarefa(idBloco) {
  const inputTexto = document.getElementById('task_text_' + idBloco);
  const inputData = document.getElementById('task_date_' + idBloco);

  const texto = inputTexto.value.trim();
  const data = inputData.value;

  if (!texto) return;

  const bloco = blocos.find(b => b.id === idBloco);
  if (bloco) {
    bloco.tarefas.push({
      id: Date.now(),
      texto: texto,
      data: data,
      concluida: false
    });

    salvarDados();
    renderizar();
  }
}

function alternarTarefa(idBloco, idTarefa) {
  const bloco = blocos.find(b => b.id === idBloco);
  if (bloco) {
    const tarefa = bloco.tarefas.find(t => t.id === idTarefa);
    if (tarefa) {
      tarefa.concluida = !tarefa.concluida;
      salvarDados();
      renderizar();
    }
  }
}

function deletarTarefa(idBloco, idTarefa) {
  const bloco = blocos.find(b => b.id === idBloco);
  if (bloco) {
    bloco.tarefas = bloco.tarefas.filter(t => t.id !== idTarefa);
    salvarDados();
    renderizar();
  }
}

function tarefaPassaNoFiltro(dataTarefa) {
  const ano = document.getElementById('filterYear').value;
  const mes = document.getElementById('filterMonth').value;
  const valDia = document.getElementById('filterDay').value;
  const dia = valDia ? valDia.padStart(2, '0') : '';

  if (!ano && !mes && !valDia) return true;
  if (!dataTarefa) return false;

  const [y, m, d] = dataTarefa.split('-');

  if (ano && y !== ano) return false;
  if (mes && m !== mes) return false;
  if (valDia && d !== dia) return false;

  return true;
}

function renderizar() {
  const container = document.getElementById('blocksContainer');
  container.innerHTML = '';

  const temFiltro = document.getElementById('filterYear').value || 
                    document.getElementById('filterMonth').value || 
                    document.getElementById('filterDay').value;

  let blocosExibidos = 0;

  blocos.forEach(bloco => {
    const tarefasFiltradas = bloco.tarefas.filter(t => tarefaPassaNoFiltro(t.data));

    if (temFiltro && tarefasFiltradas.length === 0) return;

    blocosExibidos++;

    const card = document.createElement('div');
    card.className = 'block-card';
    card.style.backgroundColor = bloco.cor;

    let html = `
      <div class="block-header">
        <span class="block-title">${bloco.titulo}</span>
        <button class="btn-delete-block" onclick="deletarBloco(${bloco.id})" title="Excluir Bloco">Excluir</button>
      </div>
      <div class="tasks-list">
    `;

    if (tarefasFiltradas.length === 0) {
      html += `<div style="font-size:13px; color:#ffffff; font-weight:bold; text-align:center; padding:10px;">Nenhuma tarefa nesta data</div>`;
    } else {
      tarefasFiltradas.forEach(t => {
        const dataFormatada = t.data ? t.data.split('-').reverse().join('/') : '';
        html += `
          <div class="task-item">
            <div class="task-left">
              <input type="checkbox" ${t.concluida ? 'checked' : ''} onclick="alternarTarefa(${bloco.id}, ${t.id})">
              <div>
                <div class="task-text ${t.concluida ? 'done' : ''}">${t.texto}</div>
                ${dataFormatada ? `<div class="task-date">📅 ${dataFormatada}</div>` : ''}
              </div>
            </div>
            <button class="btn-delete-task" onclick="deletarTarefa(${bloco.id}, ${t.id})">✕</button>
          </div>
        `;
      });
    }

    html += `</div>`;

    const hoje = new Date().toISOString().split('T')[0];
    html += `
      <div class="add-task-box">
        <input type="text" id="task_text_${bloco.id}" placeholder="+ Nova tarefa...">
        <div class="add-task-row">
          <input type="date" id="task_date_${bloco.id}" value="${hoje}">
          <button class="btn" style="width: auto; padding: 6px 12px; font-size: 12px;" onclick="adicionarTarefa(${bloco.id})">Adicionar</button>
        </div>
      </div>
    `;

    card.innerHTML = html;
    container.appendChild(card);
  });

  if (blocosExibidos === 0) {
    container.innerHTML = `<div class="empty-msg">Nenhum bloco encontrado. Crie um novo bloco na barra lateral!</div>`;
  }
}