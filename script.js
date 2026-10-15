
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
  try {
    localStorage.setItem('organize_blocos', JSON.stringify(blocos));
    return true;
  } catch (erro) {
    alert('Não foi possível salvar os dados no navegador.');
    console.error(erro);
    return false;
  }
}

function carregarDados() {
  try {
    const dadosSalvos = localStorage.getItem('organize_blocos');

    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);

      if (Array.isArray(dados)) {
        blocos = dados.filter(b =>
          b &&
          typeof b.id === 'number' &&
          typeof b.titulo === 'string' &&
          Array.isArray(b.tarefas)
        );

        // Mantém compatibilidade com tarefas já existentes.
        blocos.forEach(bloco => {
          bloco.tarefas.forEach(tarefa => {
            if (typeof tarefa.concluida !== 'boolean') {
              tarefa.concluida = false;
            }
            if (typeof tarefa.data !== 'string') {
              tarefa.data = '';
            }
          });
        });
      }
    }
  } catch (erro) {
    console.error('Erro ao carregar os dados:', erro);
    alert('Não foi possível ler os dados salvos.');
  }
}

function montarSeletorCores() {
  const container = document.getElementById('colorPicker');
  container.innerHTML = '';

  CORES.forEach((cor, index) => {
    const btn = document.createElement('div');
    btn.className = 'color-btn' + (index === 0 ? ' selected' : '');
    btn.style.backgroundColor = cor.hex;
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-label', `Selecionar cor ${cor.id}`);

    function selecionarCor() {
      document.querySelectorAll('.color-btn').forEach(b =>
        b.classList.remove('selected')
      );

      btn.classList.add('selected');
      corSelecionada = cor.hex;
    }

    btn.onclick = selecionarCor;
    btn.onkeydown = function(evento) {
      if (evento.key === 'Enter' || evento.key === ' ') {
        evento.preventDefault();
        selecionarCor();
      }
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

  if (!titulo) {
    input.focus();
    return;
  }

  const novoBloco = {
    id: Date.now(),
    titulo: titulo,
    cor: corSelecionada,
    tarefas: []
  };

  blocos.push(novoBloco);

  if (!salvarDados()) {
    blocos.pop();
    return;
  }

  input.value = '';
  renderizar();
}

function deletarBloco(idBloco) {
  const bloco = blocos.find(b => b.id === idBloco);
  if (!bloco) return;

  if (!confirm(`Excluir o bloco "${bloco.titulo}" e todas as suas tarefas?`)) {
    return;
  }

  const anteriores = blocos;
  blocos = blocos.filter(b => b.id !== idBloco);

  if (!salvarDados()) {
    blocos = anteriores;
    return;
  }

  renderizar();
}

function adicionarTarefa(idBloco) {
  const inputTexto = document.getElementById('task_text_' + idBloco);
  const inputData = document.getElementById('task_date_' + idBloco);

  const texto = inputTexto.value.trim();
  const data = inputData.value;

  if (!texto) {
    inputTexto.focus();
    return;
  }

  const bloco = blocos.find(b => b.id === idBloco);
  if (!bloco) return;

  const novaTarefa = {
    id: Date.now(),
    texto: texto,
    data: data,
    concluida: false
  };

  bloco.tarefas.push(novaTarefa);

  if (!salvarDados()) {
    bloco.tarefas = bloco.tarefas.filter(t => t.id !== novaTarefa.id);
    return;
  }

  renderizar();
}

function alternarTarefa(idBloco, idTarefa) {
  const bloco = blocos.find(b => b.id === idBloco);
  if (!bloco) return;

  const tarefa = bloco.tarefas.find(t => t.id === idTarefa);
  if (!tarefa) return;

  const estadoAnterior = tarefa.concluida;
  tarefa.concluida = !tarefa.concluida;

  if (!salvarDados()) {
    tarefa.concluida = estadoAnterior;
    return;
  }

  renderizar();
}

function deletarTarefa(idBloco, idTarefa) {
  const bloco = blocos.find(b => b.id === idBloco);
  if (!bloco) return;

  const anteriores = bloco.tarefas;
  bloco.tarefas = bloco.tarefas.filter(t => t.id !== idTarefa);

  if (!salvarDados()) {
    bloco.tarefas = anteriores;
    return;
  }

  renderizar();
}

// Calcula a diferença usando datas do calendário, sem depender
// da hora atual ou de quantas horas já passaram no dia.
function calcularPrazo(data) {
  if (!data) return null;

  const partes = data.split('-').map(Number);
  if (partes.length !== 3 || partes.some(n => !Number.isFinite(n))) {
    return null;
  }

  const [ano, mes, dia] = partes;
  const prazo = Date.UTC(ano, mes - 1, dia);

  const agora = new Date();
  const hoje = Date.UTC(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  );

  const dias = Math.round((prazo - hoje) / 86400000);

  if (dias < 0) {
    return { texto: 'Vencido', classe: 'prazo-vencido' };
  }

  if (dias === 0) {
    return { texto: 'Vence hoje', classe: 'prazo-hoje' };
  }

  if (dias === 1) {
    return { texto: 'Último dia', classe: 'prazo-ultimo-dia' };
  }

  if (dias <= 7) {
    return { texto: 'Perto', classe: 'prazo-perto' };
  }

  return { texto: 'Longe', classe: 'prazo-longe' };
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

function escaparHTML(valor) {
  return String(valor).replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere]);
}

function renderizar() {
  const container = document.getElementById('blocksContainer');
  container.innerHTML = '';

  const temFiltro =
    document.getElementById('filterYear').value ||
    document.getElementById('filterMonth').value ||
    document.getElementById('filterDay').value;

  let blocosExibidos = 0;

  blocos.forEach(bloco => {
    const tarefasFiltradas = bloco.tarefas.filter(t =>
      tarefaPassaNoFiltro(t.data)
    );

    if (temFiltro && tarefasFiltradas.length === 0) return;

    blocosExibidos++;

    const card = document.createElement('div');
    card.className = 'block-card';
    card.style.backgroundColor = bloco.cor;

    let html = `
      <div class="block-header">
        <span class="block-title">${escaparHTML(bloco.titulo)}</span>
        <button
          class="btn-delete-block"
          onclick="deletarBloco(${bloco.id})"
          title="Excluir bloco"
        >Excluir</button>
      </div>
      <div class="tasks-list">
    `;

    if (tarefasFiltradas.length === 0) {
      html += `
        <div style="font-size:13px; color:#ffffff; font-weight:bold; text-align:center; padding:10px;">
          Nenhuma tarefa nesta data
        </div>
      `;
    } else {
      tarefasFiltradas.forEach(t => {
        const dataFormatada = t.data
          ? t.data.split('-').reverse().join('/')
          : '';

        let indicadorPrazo = '';

        if (t.concluida) {
          indicadorPrazo = `
            <span class="prazo-status prazo-concluida">Concluída</span>
          `;
        } else if (t.data) {
          const status = calcularPrazo(t.data);

          if (status) {
            indicadorPrazo = `
              <span class="prazo-status ${status.classe}">
                ${status.texto}
              </span>
            `;
          }
        }

        html += `
          <div class="task-item">
            <div class="task-left">
              <input
                type="checkbox"
                ${t.concluida ? 'checked' : ''}
                onchange="alternarTarefa(${bloco.id}, ${t.id})"
                aria-label="Marcar ${escaparHTML(t.texto)} como concluída"
              >
              <div>
                <div class="task-text ${t.concluida ? 'done' : ''}">
                  ${escaparHTML(t.texto)}
                </div>
                ${dataFormatada ? `
                  <div class="task-date">📅 ${dataFormatada}</div>
                ` : ''}
                ${indicadorPrazo}
              </div>
            </div>
            <button
              class="btn-delete-task"
              onclick="deletarTarefa(${bloco.id}, ${t.id})"
              title="Excluir tarefa"
            >✕</button>
          </div>
        `;
      });
    }

    html += `</div>`;

    // Usa a data local, evitando problemas de fuso horário.
    const agora = new Date();
    const hoje = [
      agora.getFullYear(),
      String(agora.getMonth() + 1).padStart(2, '0'),
      String(agora.getDate()).padStart(2, '0')
    ].join('-');

    html += `
      <div class="add-task-box">
        <input
          type="text"
          id="task_text_${bloco.id}"
          placeholder="+ Nova tarefa..."
        >
        <div class="add-task-row">
          <input type="date" id="task_date_${bloco.id}" value="${hoje}">
          <button
            class="btn"
            style="width:auto; padding:6px 12px; font-size:12px;"
            onclick="adicionarTarefa(${bloco.id})"
          >Adicionar</button>
        </div>
      </div>
    `;

    card.innerHTML = html;
    container.appendChild(card);
  });

  if (blocosExibidos === 0) {
    container.innerHTML = `
      <div class="empty-msg">
        Nenhum bloco encontrado. Crie um novo bloco na barra lateral!
      </div>
    `;
  }
}
