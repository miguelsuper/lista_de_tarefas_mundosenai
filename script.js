const CORES = [

  { id: 'vermelho', hex: '#ff4757' },

  { id: 'laranja', hex: '#ff7f50' },

  { id: 'amarelo', hex: '#ffa500' },

  { id: 'verde', hex: '#2ed573' },

  { id: 'azul', hex: '#1e90ff' },

  { id: 'roxo', hex: '#9b59b6' }

];



const ESTADOS_TAREFA = [

  { id: 'a-fazer', titulo: 'A fazer' },

  { id: 'em-progresso', titulo: 'Em progresso' },

  { id: 'concluida', titulo: 'Concluído' },

  { id: 'atrasado', titulo: 'Atrasado' }

];



let corSelecionada = CORES[0].hex;

let blocos = [];

let blocosExpandidos = new Set();
let tarefasExpandidas = new Set();



window.onload = function() {

  carregarDados();
  montarSeletorCores();
  carregarAparencia();
  configurarEventos();
  renderizar();

};



function salvarDados() {

  try {

    localStorage.setItem('organize_blocos', JSON.stringify(blocos));

    return true;

  } catch (erro) {

    mostrarModal('Não foi possível salvar', 'Os dados não puderam ser salvos neste navegador.');

    console.error(erro);

    return false;

  }

}



function mostrarModal(titulo, mensagem, confirmar = false, textoConfirmacao = confirmar ? 'Excluir' : 'Entendi') {

  const dialogo = document.getElementById('appDialog');

  const botaoCancelar = document.getElementById('appDialogCancel');

  const botaoConfirmar = document.getElementById('appDialogConfirm');



  document.getElementById('appDialogTitle').textContent = titulo;

  document.getElementById('appDialogMessage').textContent = mensagem;

  botaoCancelar.hidden = !confirmar;

  botaoConfirmar.textContent = textoConfirmacao;



  return new Promise(resolve => {

    dialogo.addEventListener('close', () => {

      resolve(dialogo.returnValue === 'confirm');

    }, { once: true });

    dialogo.showModal();

  });

}



function carregarDados() {

  try {

    const dadosSalvos = localStorage.getItem('organize_blocos');



    if (dadosSalvos) {

      const dados = JSON.parse(dadosSalvos);

      let dadosAtualizados = false;



      if (Array.isArray(dados)) {

        blocos = dados.filter(b =>

          b &&

          typeof b.id === 'number' &&

          typeof b.titulo === 'string' &&

          Array.isArray(b.tarefas)

        );



        blocos.forEach(bloco => {

          bloco.tarefas.forEach(tarefa => {

            if (typeof tarefa.concluida !== 'boolean') {

              tarefa.concluida = false;

              dadosAtualizados = true;

            }

            if (typeof tarefa.data !== 'string') {

              tarefa.data = '';

              dadosAtualizados = true;

            }

            if (!ESTADOS_TAREFA.some(estado => estado.id === tarefa.status)) {

              tarefa.status = tarefa.concluida ? 'concluida' : 'a-fazer';

              dadosAtualizados = true;

            }

            if (tarefa.status === 'atrasado' && !prazoVencido(tarefa)) {

              tarefa.status = tarefa.concluida ? 'concluida' : 'a-fazer';

              dadosAtualizados = true;

            }

            if (tarefa.concluida !== (tarefa.status === 'concluida')) {

              dadosAtualizados = true;

            }

            tarefa.concluida = tarefa.status === 'concluida';

          });

        });



        if (dadosAtualizados) {

          salvarDados();

        }

      }

    }

  } catch (erro) {

    console.error('Erro ao carregar os dados:', erro);

    mostrarModal('Não foi possível carregar', 'Os dados salvos não puderam ser lidos neste navegador.');

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

function carregarAparencia() {
  try {
    const temaSalvo = localStorage.getItem('organize_tema');
    const estiloSalvo = localStorage.getItem('organize_estilo');
    aplicarAparencia(
      temaSalvo === 'escuro' ? 'escuro' : 'claro',
      estiloSalvo === 'vidro' ? 'vidro' : 'liso'
    );
  } catch (erro) {
    console.error('Erro ao carregar as opções de aparência:', erro);
    mostrarModal('Não foi possível carregar a aparência', 'As preferências de aparência não puderam ser lidas neste navegador.');
    aplicarAparencia('claro', 'liso');
  }
}

function aplicarAparencia(tema, estilo) {
  document.body.dataset.theme = tema;
  document.body.dataset.style = estilo;

  document.querySelectorAll('[data-appearance-theme]').forEach(botao => {
    botao.setAttribute('aria-pressed', String(botao.dataset.appearanceTheme === tema));
  });
  document.querySelectorAll('[data-appearance-style]').forEach(botao => {
    botao.setAttribute('aria-pressed', String(botao.dataset.appearanceStyle === estilo));
  });
}


function configurarEventos() {

  const menu = document.getElementById('sidePanel');
  const btnMenu = document.getElementById('btnMenu');
  const filtroPanel = document.getElementById('filterPanel');
  const btnFiltros = document.getElementById('btnFilters');
  const btnAparencia = document.getElementById('btnAppearanceToggle');
  const painelAparencia = document.getElementById('appearancePanel');

  btnAparencia.addEventListener('click', () => {
    const aberto = painelAparencia.hidden;
    painelAparencia.hidden = !aberto;
    btnAparencia.setAttribute('aria-expanded', String(aberto));
  });

  painelAparencia.addEventListener('click', evento => {
    const botaoTema = evento.target.closest('[data-appearance-theme]');
    const botaoEstilo = evento.target.closest('[data-appearance-style]');
    if (!botaoTema && !botaoEstilo) return;

    const tema = botaoTema ? botaoTema.dataset.appearanceTheme : document.body.dataset.theme;
    const estilo = botaoEstilo ? botaoEstilo.dataset.appearanceStyle : document.body.dataset.style;
    aplicarAparencia(tema, estilo);
    try {
      localStorage.setItem('organize_tema', tema);
      localStorage.setItem('organize_estilo', estilo);
    } catch (erro) {
      console.error('Erro ao salvar as opções de aparência:', erro);
      mostrarModal('Não foi possível salvar a aparência', 'As preferências de aparência não puderam ser salvas neste navegador.');
    }
    painelAparencia.hidden = true;
    btnAparencia.setAttribute('aria-expanded', 'false');
  });

  function fecharMenu() {
    menu.classList.remove('is-open');
    btnMenu.setAttribute('aria-expanded', 'false');
    btnMenu.setAttribute('aria-label', 'Abrir menu de blocos');
    menu.querySelector('.side-panel-content').setAttribute('inert', '');
  }

  btnMenu.addEventListener('click', () => {
    const aberto = menu.classList.toggle('is-open');
    btnMenu.setAttribute('aria-expanded', String(aberto));
    btnMenu.setAttribute('aria-label', aberto ? 'Fechar menu de blocos' : 'Abrir menu de blocos');
    menu.querySelector('.side-panel-content').toggleAttribute('inert', !aberto);
    if (aberto) filtroPanel.classList.remove('is-open');
  });
  btnFiltros.addEventListener('click', () => {
    const aberto = filtroPanel.classList.toggle('is-open');
    btnFiltros.setAttribute('aria-expanded', String(aberto));
  });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') {
      fecharMenu();
      filtroPanel.classList.remove('is-open');
      btnFiltros.setAttribute('aria-expanded', 'false');
      painelAparencia.hidden = true;
      btnAparencia.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('click', evento => {
    if (!evento.target.closest('.appearance-picker')) {
      painelAparencia.hidden = true;
      btnAparencia.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('btnCreateBlock').onclick = criarBloco;

  document.getElementById('filterYear').onchange = renderizar;

  document.getElementById('filterYear').oninput = renderizar;

  document.getElementById('filterMonth').onchange = renderizar;

  document.getElementById('filterDay').oninput = renderizar;



  document.getElementById('btnClearFilters').onclick = function() {

    document.getElementById('filterYear').value = '';

    document.getElementById('filterMonth').value = '';

    document.getElementById('filterDay').value = '';

    renderizar();

  };



  document.addEventListener('click', function(evento) {

    if (!evento.target.closest('.date-control')) {

      document.querySelectorAll('.date-picker:not([hidden])').forEach(calendario => {

        calendario.hidden = true;

      });

    }

  }, true);

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



async function deletarBloco(idBloco) {

  const bloco = blocos.find(b => b.id === idBloco);

  if (!bloco) return;



  if (!await mostrarModal('Excluir bloco?', `O bloco "${bloco.titulo}" e todas as suas tarefas serão excluídos.`, true)) {

    return;

  }



  const anteriores = blocos;

  blocos = blocos.filter(b => b.id !== idBloco);

  blocosExpandidos.delete(idBloco);
  tarefasExpandidas.forEach(chave => { if (chave.startsWith(`${idBloco}:`)) tarefasExpandidas.delete(chave); });



  if (!salvarDados()) {

    blocos = anteriores;

    return;

  }



  renderizar();

}



function alternarExpansaoBloco(idBloco) {

  const expandir = !blocosExpandidos.has(idBloco);



  if (!expandir) {

    blocosExpandidos.delete(idBloco);
  } else {

    blocosExpandidos.add(idBloco);

  }



  renderizar();



  if (expandir) {

    requestAnimationFrame(() => {

      document.querySelector(`[data-bloco-id="${idBloco}"]`)

        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });

    });

  }

}



function obterHoje() {

  const agora = new Date();

  const ano = agora.getFullYear();

  const mes = String(agora.getMonth() + 1).padStart(2, '0');

  const dia = String(agora.getDate()).padStart(2, '0');



  return `${ano}-${mes}-${dia}`;

}



function prazoVencido(tarefa) {

  return Boolean(tarefa.data && tarefa.data < obterHoje());

}



function formatarDataBrasileira(dataISO) {

  if (!dataISO) return '';

  const [ano, mes, dia] = dataISO.split('-');

  return `${dia}/${mes}/${ano}`;

}



function converterDataBrasileiraParaISO(dataBrasileira) {

  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataBrasileira);

  if (!partes) return '';



  const [, dia, mes, ano] = partes;

  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));



  if (

    data.getFullYear() !== Number(ano) ||

    data.getMonth() !== Number(mes) - 1 ||

    data.getDate() !== Number(dia)

  ) {

    return '';

  }



  return `${ano}-${mes}-${dia}`;

}



async function adicionarTarefa(idBloco) {

  const inputTexto = document.getElementById('task_text\_' + idBloco);

  const inputData = document.getElementById('task_date\_' + idBloco);



  const texto = inputTexto.value.trim();

  const dataDigitada = inputData.value.trim();

  const data = converterDataBrasileiraParaISO(dataDigitada);

  const hoje = obterHoje();



  if (!texto) {

    inputTexto.focus();

    return;

  }



  if (dataDigitada && !data) {

    await mostrarModal('Data inválida', 'Digite uma data válida no formato dd/mm/aaaa.');

    inputData.focus();

    return;

  }



  if (data && data < hoje) {

    await mostrarModal('Data fora do prazo', 'Não é possível escolher uma data anterior a hoje.');

    inputData.focus();

    return;

  }



  const bloco = blocos.find(b => b.id === idBloco);

  if (!bloco) return;



  const novaTarefa = {

    id: Date.now(),

    texto: texto,

    data: data,

    concluida: false,

    status: 'a-fazer'

  };



  bloco.tarefas.push(novaTarefa);



  if (!salvarDados()) {

    bloco.tarefas = bloco.tarefas.filter(t => t.id !== novaTarefa.id);

    return;

  }



  renderizar();

}



function alternarCalendario(idBloco) {

  const calendario = document.getElementById('calendar\_' + idBloco);

  const inputData = document.getElementById('task_date\_' + idBloco);



  if (!calendario.hidden) {

    calendario.hidden = true;

    return;

  }



  const dataSelecionada = converterDataBrasileiraParaISO(inputData.value);

  const referencia = dataSelecionada

    ? new Date(`${dataSelecionada}T00:00:00`)

    : new Date();



  calendario.dataset.ano = referencia.getFullYear();

  calendario.dataset.mes = referencia.getMonth();

  calendario.hidden = false;

  renderizarCalendario(idBloco);

}



function mudarMesCalendario(idBloco, direcao) {

  const calendario = document.getElementById('calendar\_' + idBloco);

  const referencia = new Date(

    Number(calendario.dataset.ano),

    Number(calendario.dataset.mes) + direcao,

    1

  );



  calendario.dataset.ano = referencia.getFullYear();

  calendario.dataset.mes = referencia.getMonth();

  renderizarCalendario(idBloco);

}



function mudarAnoCalendario(idBloco, direcao) {

  const calendario = document.getElementById('calendar_' + idBloco);

  const referencia = new Date(

    Number(calendario.dataset.ano) + direcao,

    Number(calendario.dataset.mes),

    1

  );



  calendario.dataset.ano = referencia.getFullYear();

  calendario.dataset.mes = referencia.getMonth();

  renderizarCalendario(idBloco);

}



function selecionarDataCalendario(idBloco, dataISO) {

  document.getElementById('task_date\_' + idBloco).value = formatarDataBrasileira(dataISO);

  document.getElementById('calendar\_' + idBloco).hidden = true;

}



function renderizarCalendario(idBloco) {

  const calendario = document.getElementById('calendar_' + idBloco);

  const ano = Number(calendario.dataset.ano);

  const mes = Number(calendario.dataset.mes);

  const primeiroDia = new Date(ano, mes, 1).getDay();

  const totalDias = new Date(ano, mes + 1, 0).getDate();

  const tituloMes = new Intl.DateTimeFormat('pt-BR', {

    month: 'long',

    year: 'numeric'

  }).format(new Date(ano, mes, 1));

  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const dataSelecionada = converterDataBrasileiraParaISO(

    document.getElementById('task_date_' + idBloco).value

  );

  let dias = diasSemana.map(dia => `<span class="calendar-weekday">${dia}</span>`).join('');



  for (let espaco = 0; espaco < primeiroDia; espaco++) {

    dias += '<span class="calendar-day-empty"></span>';

  }



  for (let dia = 1; dia <= totalDias; dia++) {

    const dataISO = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    const classes = [

      'calendar-day',

      dataISO === dataSelecionada ? 'selected' : '',

      dataISO === obterHoje() ? 'today' : ''

    ].filter(Boolean).join(' ');

    const desabilitada = dataISO < obterHoje() ? 'disabled' : '';

    dias += `

      <button

        type="button"

        class="${classes}"

        ${desabilitada}

        onclick="selecionarDataCalendario(${idBloco}, '${dataISO}')"

        aria-label="${dia} de ${tituloMes}"

      >${dia}</button>

    `;

  }



  calendario.innerHTML = `

    <div class="calendar-header">

      <div class="calendar-nav-group">

        <button type="button" onclick="mudarAnoCalendario(${idBloco}, -1)" aria-label="Ano anterior">‹‹</button>

        <button type="button" onclick="mudarMesCalendario(${idBloco}, -1)" aria-label="Mês anterior">‹</button>

      </div>

      <strong>${tituloMes}</strong>

      <div class="calendar-nav-group">

        <button type="button" onclick="mudarMesCalendario(${idBloco}, 1)" aria-label="Próximo mês">›</button>

        <button type="button" onclick="mudarAnoCalendario(${idBloco}, 1)" aria-label="Próximo ano">››</button>

      </div>

    </div>

    <div class="calendar-grid">${dias}</div>

  `;

}



function alternarTarefa(idBloco, idTarefa) {

  const bloco = blocos.find(b => b.id === idBloco);

  if (!bloco) return;



  const tarefa = bloco.tarefas.find(t => t.id === idTarefa);

  if (!tarefa) return;



  const estadoAnterior = {

    concluida: tarefa.concluida,

    status: tarefa.status

  };

  tarefa.status = tarefa.concluida ? 'a-fazer' : 'concluida';

  tarefa.concluida = tarefa.status === 'concluida';



  if (!salvarDados()) {

    tarefa.concluida = estadoAnterior.concluida;

    tarefa.status = estadoAnterior.status;

    return;

  }



  renderizar();

}



async function atualizarStatusTarefa(idBloco, idTarefa, novoStatus) {

  if (!ESTADOS_TAREFA.some(estado => estado.id === novoStatus)) return;



  const bloco = blocos.find(b => b.id === idBloco);

  if (!bloco) return;



  const tarefa = bloco.tarefas.find(t => t.id === idTarefa);

  if (!tarefa || tarefa.status === novoStatus) return;



  if (novoStatus === 'atrasado' && !prazoVencido(tarefa)) {

    await mostrarModal('Prazo ainda não vencido', 'Uma tarefa só pode ser marcada como atrasada depois que o prazo passar.');

    return;

  }



  const estadoAnterior = {

    concluida: tarefa.concluida,

    status: tarefa.status

  };

  tarefa.status = novoStatus;

  tarefa.concluida = novoStatus === 'concluida';



  if (!salvarDados()) {

    tarefa.concluida = estadoAnterior.concluida;

    tarefa.status = estadoAnterior.status;

    return;

  }



  renderizar();

}



function iniciarArraste(evento, idBloco, idTarefa) {

  evento.dataTransfer.effectAllowed = 'move';

  evento.dataTransfer.setData('text/plain', JSON.stringify({ idBloco, idTarefa }));

}



function permitirSoltar(evento) {

  evento.preventDefault();

  evento.currentTarget.classList.add('drag-over');

}



function sairDaColuna(evento) {

  if (!evento.currentTarget.contains(evento.relatedTarget)) {

    evento.currentTarget.classList.remove('drag-over');

  }

}



async function soltarTarefa(evento, idBloco, novoStatus) {

  evento.preventDefault();

  evento.currentTarget.classList.remove('drag-over');



  try {

    const tarefaArrastada = JSON.parse(evento.dataTransfer.getData('text/plain'));

    if (tarefaArrastada.idBloco !== idBloco) return;

    await atualizarStatusTarefa(idBloco, tarefaArrastada.idTarefa, novoStatus);

  } catch (erro) {

    console.error('Não foi possível mover a tarefa:', erro);

  }

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



function alternarExpansaoTarefa(idBloco, idTarefa) {
  const chave = `${idBloco}:${idTarefa}`;
  if (tarefasExpandidas.has(chave)) tarefasExpandidas.delete(chave);
  else tarefasExpandidas.add(chave);
  renderizar();
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

    const expandido = blocosExpandidos.has(bloco.id);

    card.className = 'block-card' + (expandido ? ' is-expanded' : '');
    card.dataset.blocoId = bloco.id;
    card.style.backgroundColor = bloco.cor;
    card.style.setProperty('--block-color', bloco.cor);
    card.tabIndex = 0;
    card.setAttribute('aria-expanded', String(expandido));
    card.addEventListener('click', evento => {
      if (evento.target.closest('button, input, select, textarea, a, .task-item')) return;
      alternarExpansaoBloco(bloco.id);
    });
    card.addEventListener('keydown', evento => {
      if (evento.target !== card || (evento.key !== 'Enter' && evento.key !== ' ')) return;
      evento.preventDefault();
      alternarExpansaoBloco(bloco.id);
    });



    let html = `

      <div class="block-header">

        <span class="block-title">${escaparHTML(bloco.titulo)}</span>

        <div class="block-actions">
          <button

            class="btn-delete-block"

            onclick="deletarBloco(${bloco.id})"

            title="Excluir bloco"

          >Excluir</button>

        </div>

      </div>

      <div class="kanban-board">

    `;



    ESTADOS_TAREFA.forEach(estado => {

      const tarefasDaColuna = tarefasFiltradas.filter(t => t.status === estado.id);



      html += `

        <section

          class="kanban-column"

          ondragover="permitirSoltar(event)"

          ondragleave="sairDaColuna(event)"

          ondrop="soltarTarefa(event, ${bloco.id}, '${estado.id}')"

          aria-label="Coluna ${estado.titulo}"

        >

          <div class="kanban-column-header">

            <h2>${estado.titulo}</h2>

            <span>${tarefasDaColuna.length}</span>

          </div>

          <div class="kanban-tasks">

      `;



      if (tarefasDaColuna.length === 0) {

        html += '<p class="kanban-empty">Nenhuma tarefa</p>';

      }



      tarefasDaColuna.forEach(t => {

        const dataFormatada = t.data

          ? t.data.split('-').reverse().join('/')

          : '';



        let indicadorPrazo = '';



        if (t.data && t.status !== 'concluida') {

          const status = calcularPrazo(t.data);



          if (status) {

            indicadorPrazo = `

              <span class="prazo-status ${status.classe}">

                ${status.texto}

              </span>

            `;

          }

        }



        const tarefaExpandida = tarefasExpandidas.has(`${bloco.id}:${t.id}`);
        html += `
          <div
            class="task-item ${tarefaExpandida ? 'task-expanded' : ''}"
            draggable="true"
            onclick="alternarExpansaoTarefa(${bloco.id}, ${t.id})"
            ondragstart="iniciarArraste(event, ${bloco.id}, ${t.id})"
            aria-expanded="${tarefaExpandida}"
            tabindex="0"
            onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();alternarExpansaoTarefa(${bloco.id}, ${t.id})}"
          >
            <div class="task-card-heading">
              <div class="task-left">

              <div>

                <div class="task-text ${t.status === 'concluida' ? 'done' : ''}">

                  ${escaparHTML(t.texto)}

                </div>

                ${dataFormatada ? `

                  <div class="task-date" onclick="event.stopPropagation(); editarDataTarefa(${bloco.id}, ${t.id});" title="Alterar data da tarefa" role="button" tabindex="0" onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault(); event.stopPropagation(); editarDataTarefa(${bloco.id}, ${t.id});}">📅 ${dataFormatada}</div>

                ` : ''}

                ${indicadorPrazo}

              </div>
              </div>
              <span class="task-expand-indicator" aria-hidden="true">${tarefaExpandida ? '−' : '+'}</span>
            </div>
            <div class="task-details" ${tarefaExpandida ? '' : 'hidden'} onclick="event.stopPropagation()">
              <div class="task-actions">

              <select

                class="task-status-select"

                onchange="atualizarStatusTarefa(${bloco.id}, ${t.id}, this.value)"

                aria-label="Status da tarefa ${escaparHTML(t.texto)}"

              >

                ${ESTADOS_TAREFA.map(opcao => `

                  <option

                    value="${opcao.id}"

                    ${t.status === opcao.id ? 'selected' : ''}

                    ${opcao.id === 'atrasado' && !prazoVencido(t) ? 'disabled' : ''}

                  >

                    ${opcao.titulo}

                  </option>

                `).join('')}

              </select>

              <button

                class="btn-delete-task"

                onclick="deletarTarefa(${bloco.id}, ${t.id})"

                title="Excluir tarefa"

                aria-label="Excluir tarefa ${escaparHTML(t.texto)}"

              >✕</button>
              </div>
            </div>
          </div>
        `;

      });



      html += `</div></section>`;

    });



    html += `</div>`;



    const hoje = obterHoje();



    html += `

      <div class="add-task-box">

        <input

          type="text"

          id="task_text\_${bloco.id}"

          placeholder="+ Nova tarefa..."

        >

        <div class="add-task-row">

          <div class="date-control">

            <input

              type="text"

              id="task_date\_${bloco.id}"

              value="${formatarDataBrasileira(hoje)}"

              placeholder="dd/mm/aaaa"

              inputmode="numeric"

              maxlength="10"

              aria-label="Data da tarefa no formato dia, mês e ano"

            >

            <button

              type="button"

              class="btn-open-calendar"

              onclick="alternarCalendario(${bloco.id})"

              aria-label="Abrir calendário"

              title="Abrir calendário"

            >▦</button>

            <div id="calendar\_${bloco.id}" class="date-picker" hidden></div>

          </div>

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



async function editarDataTarefa(idBloco, idTarefa) {

  const bloco = blocos.find(b => b.id === idBloco);

  if (!bloco) return;



  const tarefa = bloco.tarefas.find(t => t.id === idTarefa);

  if (!tarefa) return;



  const confirmar = await mostrarModal(
    'Alterar data?',
    `Deseja alterar a data da tarefa "${tarefa.texto}"?`,
    true,
    'Alterar'
  );

  if (!confirmar) return;



  const valorAtual = tarefa.data ? formatarDataBrasileira(tarefa.data) : '';
  const novaDataInput = window.prompt(
    'Digite a nova data da tarefa (dd/mm/aaaa):',
    valorAtual
  );

  if (novaDataInput === null) return;



  const novaDataTexto = novaDataInput.trim();

  const novaData = converterDataBrasileiraParaISO(novaDataTexto);



  if (!novaDataTexto) {

    if (!await mostrarModal('Data vazia', 'Deseja remover a data da tarefa?', true, 'Remover')) {
      return;
    }

    tarefa.data = '';

  } else {

    if (!novaData) {
      await mostrarModal('Data inválida', 'Digite uma data válida no formato dd/mm/aaaa.');
      return;
    }



    if (novaData < obterHoje()) {
      await mostrarModal('Data fora do prazo', 'A data da tarefa deve ser hoje ou uma data futura.');
      return;
    }

    tarefa.data = novaData;
  }



  if (!salvarDados()) {
    return;
  }



  renderizar();

}
