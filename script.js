(function checkAuthentication() {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Acesso negado. Por favor, faça o login para continuar.');
    window.location.href = 'login.html';
  }
})();

import './auth.js';
import { fetchCentrais, fetchEquipamentos, fetchClientes } from './api/routes.js';

const modalOverlay = document.getElementById('acessos-modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const acessosListContainer = document.getElementById('acessos-list-container');
const modalTitle = document.getElementById('modal-title');

const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;
const darkModeLabel = document.querySelector('.dark-mode-label');

// Referência ao botão de toggle da sidebar
const toggleSidebarBtn = document.querySelector('.toggle-btn');
const sidebar = document.getElementById('sidebar'); // Referência à sidebar

// Função auxiliar para aplicar/remover a classe dark-mode
function applyTheme(isDarkMode) {
    if (isDarkMode) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
    if (darkModeToggle) {
        darkModeToggle.checked = isDarkMode;
    }
}

// **NOVO: Função global para toggle da sidebar (agora chamada apenas pelo JS)**
function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  // Ajusta a visibilidade do label do dark mode APÓS a transição
  setTimeout(() => {
    if (sidebar.classList.contains('collapsed')) {
      if (darkModeLabel) { // Verifica se darkModeLabel existe
        darkModeLabel.style.opacity = '0';
        darkModeLabel.style.width = '0';
        darkModeLabel.style.overflow = 'hidden';
      }
    } else {
      if (darkModeLabel) { // Verifica se darkModeLabel existe
        darkModeLabel.style.opacity = '1';
        darkModeLabel.style.width = 'auto';
        darkModeLabel.style.overflow = 'visible';
      }
    }
  }, 300); // O mesmo tempo da transição CSS do sidebar
}


document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('theme') === 'dark');

    renderCentrais();

    const configSection = document.getElementById('configuracoes');
    if (configSection) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (configSection.classList.contains('active')) {
                        const lastUpdatedElement = document.getElementById('last-updated');
                        if (lastUpdatedElement) {
                            lastUpdatedElement.textContent = new Date().toLocaleString('pt-BR');
                        }
                    }
                }
            }
        });
        observer.observe(configSection, { attributes: true });
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            applyTheme(darkModeToggle.checked);
        });
    }

    // Lógica para esconder/mostrar o label do modo escuro ao carregar
    if (sidebar.classList.contains('collapsed')) {
        if (darkModeLabel) {
            darkModeLabel.style.opacity = '0';
            darkModeLabel.style.width = '0';
            darkModeLabel.style.overflow = 'hidden';
        }
    }

    // **CORREÇÃO AQUI: Adiciona o EventListener para o botão de toggle da sidebar**
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // *** IMPORTANTE: IMPEDE QUE O CLIQUE SE PROPAGUE ***
            toggleSidebar(); // Chama a função que já temos para alternar a sidebar
        });
    }

    // **CORREÇÃO AQUI: A lógica de fechar a sidebar quando clica fora**
    document.addEventListener('click', e => {
      // Verifica se o clique foi fora da sidebar E fora do botão de toggle
      // Se a sidebar NÃO está recolhida E o clique NÃO está DENTRO da sidebar
      // E o clique NÃO está DENTRO do botão de toggle...
      if (!sidebar.classList.contains('collapsed') && !sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
        sidebar.classList.add('collapsed'); // Recolhe a sidebar
        // Ajusta o label do dark mode após recolher manualmente
        if (darkModeLabel) {
            darkModeLabel.style.opacity = '0';
            darkModeLabel.style.width = '0';
            darkModeLabel.style.overflow = 'hidden';
        }
      }
    });

});


// ---------------------------------------- EVENTOS DO MENU LATERAL  ----------------------------------------

// Centrais
document.querySelector('.sidebar li.centrais')?.addEventListener('click', () => {
  showSection('centrais');
  renderCentrais();
});
// Equipamentos
document.querySelector('.sidebar li.equipamento')?.addEventListener('click', () => {
  showSection('equipamentos');
  renderEquipamentos();
});
//clientes
document.querySelector('.sidebar li.clientes')?.addEventListener('click', () => {
  showSection('clientes');
  renderClientes();
});
//configurações
document.querySelector('.sidebar li.configuracoes')?.addEventListener('click', () => {
  showSection('configuracoes');
});

// ---------------------------------------- MODAL DE ACESSOS ----------------------------------------
function openAcessosModal(clienteNome, acessos) {
  modalTitle.textContent = `Detalhes de Acessos de ${clienteNome}`;
  acessosListContainer.innerHTML = '';

  if (acessos && acessos.length > 0) {
    const ul = document.createElement('ul');
    ul.className = 'acessos-detail-list';

    acessos.forEach((acesso, index) => {
      const li = document.createElement('li');
      li.className = 'acesso-item';

      const parseAndFormatDate = (dateString) => {
        if (!dateString) return 'Data não informada';
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('-');
        const isoFormattedDate = `${year}-${month}-${day}T${timePart}`;
        const dateObj = new Date(isoFormattedDate);
        if (isNaN(dateObj.getTime())) {
          return 'Data Inválida';
        }
        return dateObj.toLocaleString('pt-BR');
      };

      const begin = parseAndFormatDate(acesso.begin_time);
      const end = parseAndFormatDate(acesso.end_time);

      const central = acesso.central || 'N/A';
      const equipamento = acesso.equipamento || 'N/A';
      const userIdEquipamento = acesso.user_idEquipamento || 'N/A';

      li.innerHTML = `
        <h4>Acesso ${index + 1}</h4>
        <p><strong>Central:</strong> ${central}</p>
        <p><strong>Equipamento ID:</strong> ${equipamento}</p>
        <p><strong>Usuário ID no Equipamento:</strong> ${userIdEquipamento}</p>
        <p><strong>Período:</strong> ${begin} &rarr; ${end}</p>
        <hr>
      `;
      ul.appendChild(li);
    });
    acessosListContainer.appendChild(ul);
  } else {
    acessosListContainer.innerHTML = '<p>Nenhum acesso registrado para este cliente.</p>';
  }

  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

// MOSTRAR SEÇÃO
function showSection(id) {
  document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.sidebar nav ul li').forEach(li => li.classList.remove('active'));
  const current = document.querySelector(`li.${id}`);
  if (current) current.classList.add('active');
}

// RENDERIZAÇÃO DAS CENTRAIS
async function renderCentrais() {
  console.log('DEBUG: Iniciando renderCentrais');
  const centralList = document.getElementById('centrais-list');
  if (!centralList) return console.warn('WARNING: #centrais-list não encontrado');

  centralList.innerHTML = '';
  try {
    const { resp = [] } = await fetchCentrais();
    console.log('DEBUG: Dados de centrais recebidos:', resp);

    resp.forEach(c => {
      const card = document.createElement('div');
      card.className = '_card_14g8r_30';
      card.dataset.id = c.id;
      card.onclick = () => console.log('Central selecionada:', c.id);

      const header = document.createElement('div');
      header.className = '_cardHeader_14g8r_44';
      const title = document.createElement('h3');
      title.textContent = c.nomeEdificio;
      const status = document.createElement('span');
      status.className = `_status_14g8r_51 _${c.status || 'offline'}_14g8r_57`;
      status.textContent = c.status;
      header.append(title, status);

      const content = document.createElement('div');

      const icon = document.createElement('div');
      icon.className = '_controllerIcon_14g8r_67';

      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="#c8300c" viewBox="0 0 256 256"><path d="M248,210H230V94h2a6,6,0,0,0,0-12H182V46h2a6,6,0,0,0,0-12H40a6,6,0,0,0,0,12h2V210H24a6,6,0,0,0,0,12H248a6,6,0,0,0,0-12ZM218,94V210H182V94ZM54,46H170V210H142V160a6,6,0,0,0-6-6H88a6,6,0,0,0-6,6v50H54Zm76,164H94V166h36ZM74,80a6,6,0,0,1,6-6H96a6,6,0,0,1,0,12H80A6,6,0,0,1,74,80Zm48,0a6,6,0,0,1,6-6h16a6,6,0,0,1,0,12H128A6,6,0,0,1,122,80ZM80,126a6,6,0,0,1,0-12H96a6,6,0,0,1,0,12Zm42-6a6,6,0,0,1,6-6h16a6,6,0,0,1,0,12H128A6,6,0,0,1,122,120Z"></path></svg>`;

      const location = document.createElement('p');
      location.textContent = `${c.rua}, ${c.numero} - ${c.bairro}`;
      content.append(icon, location);

      card.append(header, content);
      centralList.append(card);
    });
  } catch (err) {
    console.error('ERROR: Falha ao carregar centrais:', err);
    centralList.innerHTML = '<p>Erro ao carregar centrais.</p>';
  }
}
// RENDERIZAÇÃO DOS EQUIPAMENTOS
async function renderEquipamentos() {
  console.log('DEBUG: Iniciando renderEquipamentos');
  const equipList = document.getElementById('equipamentos-list');
  if (!equipList) return;

  equipList.replaceChildren();
  try {
    const { resp = [] } = await fetchEquipamentos();

    resp.forEach(e => {
      const card = document.createElement('div');
      card.className = '_card_14g8r_30 equipment-card';

      const header = document.createElement('div');
      header.className = '_cardHeader_14g8r_44';
      const idElem = document.createElement('p');
      idElem.className = 'equipment-id';
      idElem.textContent = e.device_id;

      const iconElem = document.createElement('div');
      iconElem.className = '_controllerIcon_14g8r_67';

      iconElem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="#c8300c" viewBox="0 0 256 256"><path d="M222,40V76a6,6,0,0,1-12,0V46H180a6,6,0,0,1,0-12h36A6,6,0,0,1,222,40Zm-6,134a6,6,0,0,0-6,6v30H180a6,6,0,0,0,0,12h36a6,6,0,0,0,6-6V180A6,6,0,0,0,216,174ZM76,210H46V180a6,6,0,0,0-12,0v36a6,6,0,0,0,6,6H76a6,6,0,0,0,0-12ZM40,82a6,6,0,0,0,6-6V46H76a6,6,0,0,0,0-12H40a6,6,0,0,0-6,6V76A6,6,0,0,0,40,82Zm136,92a6,6,0,0,1-4.8-2.4,54,54,0,0,0-86.4,0,6,6,0,1,1-9.6-7.2,65.65,65.65,0,0,1,29.69-22.26,38,38,0,1,1,46.22,0A65.65,65.65,0,0,1,180.8,164.4,6,6,0,0,1,176,174Zm-48-36a26,26,0,1,0-26-26A26,26,0,0,0,128,138Z"></path></svg>`;

      header.append(idElem, iconElem);

      const title = document.createElement('h3');
      title.textContent = e.device_hostname;
      const status = document.createElement('span');
      status.className = '_status_14g8r_51 status ativo';
      status.textContent = 'ativo';

      const body = document.createElement('dl');
      body.className = 'equipment-details';
      const fields = [
        ['IP', e.ip],
        ['MAC', e.mac],
        ['Criado em', new Date(e.createdAt).toLocaleString('pt-BR')],
        ['Atualizado em', new Date(e.updatedAt).toLocaleString('pt-BR')]
      ];

      fields.forEach(([label, val]) => {
        const dt = document.createElement('dt'); dt.textContent = label;
        const dd = document.createElement('dd'); dd.textContent = val;
        body.append(dt, dd);
      });

      card.append(header, title, status, body);
      equipList.append(card);
    });
  } catch (err) {
    equipList.innerHTML = '<p>Erro ao carregar equipamentos.</p>';
  }
}

// RENDERIZAÇÃO DOS CLIENTES
async function renderClientes() {
  const tbody = document.getElementById('clientes-tbody');
  if (!tbody) {
    console.warn('WARNING: #clientes-tbody não encontrado');
    return;
  }
  tbody.innerHTML = '';

  tbody.addEventListener('click', (event) => {
    const button = event.target.closest('.view-acessos-btn');
    if (button) {
      const clienteNome = button.dataset.clienteNome;
      try {
        const acessos = JSON.parse(button.dataset.acessos);
        openAcessosModal(clienteNome, acessos);
      } catch (e) {
        console.error("Erro ao parsear JSON de acessos:", e);
      }
    }
  });

  try {
    const { resp: todosClientes = [] } = await fetchClientes();
    console.log('DEBUG: Dados de clientes recebidos:', todosClientes);

    if (!todosClientes.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'Nenhum cliente encontrado.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    const clientesPorCentral = {};

    todosClientes.forEach(cliente => {
      if (cliente.acessos && cliente.acessos.length > 0) {
        cliente.acessos.forEach(acesso => {
          const centralNome = acesso.central || 'Central Desconhecida';
          if (!clientesPorCentral[centralNome]) {
            clientesPorCentral[centralNome] = [];
          }
          const clienteJaAdicionado = clientesPorCentral[centralNome].some(c => c.idYD === cliente.idYD);
          if (!clienteJaAdicionado) {
            clientesPorCentral[centralNome].push(cliente);
          }
        });
      } else {
        const grupoSemAcesso = 'Clientes Sem Acessos Registrados';
        if (!clientesPorCentral[grupoSemAcesso]) {
          clientesPorCentral[grupoSemAcesso] = [];
        }
        const clienteJaAdicionado = clientesPorCentral[grupoSemAcesso].some(c => c.idYD === cliente.idYD);
        if (!clienteJaAdicionado) {
          clientesPorCentral[grupoSemAcesso].push(cliente);
        }
      }
    });

    for (const centralNome in clientesPorCentral) {
      const headerRow = document.createElement('tr');
      headerRow.className = 'group-header';
      const headerCell = document.createElement('td');
      headerCell.colSpan = 5;
      headerCell.textContent = `Central: ${centralNome}`;
      headerRow.appendChild(headerCell);
      tbody.appendChild(headerRow);

      const clientesDoGrupo = clientesPorCentral[centralNome];

      clientesDoGrupo.forEach(cliente => {
        const tr = document.createElement('tr');

        const totalAcessos = cliente.acessos?.length || 0;
        const createdAt = cliente.createdAt ? new Date(cliente.createdAt).toLocaleString('pt-BR') : '-';
        const updatedAt = cliente.updatedAt ? new Date(cliente.updatedAt).toLocaleString('pt-BR') : '-';

        let acessosHtml = 'Nenhum acesso';
        if (totalAcessos > 0) {
          const acessosString = JSON.stringify(cliente.acessos).replace(/"/g, "&quot;");
          const clienteNomeString = (cliente.name || 'Cliente').replace(/"/g, "&quot;");
          acessosHtml = `<button class="view-acessos-btn" data-acessos="${acessosString}" data-cliente-nome="${clienteNomeString}">${totalAcessos} Acesso(s)</button>`;
        }

        tr.innerHTML = `
          <td>${cliente.idYD || '-'}</td>
          <td>${cliente.name || '-'}</td>
          <td>${acessosHtml}</td>
          <td>${createdAt}</td>
          <td>${updatedAt}</td>
        `;

        tbody.appendChild(tr);
      });
    }

  } catch (err) {
    console.error('ERROR: Falha ao carregar clientes:', err);
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'Erro ao carregar os dados. Verifique o console.';
    td.style.textAlign = 'center';
    td.style.color = 'red';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

// ---------------------------------------- MENU LATERAL  ----------------------------------------
// Nota: a função toggleSidebar() foi movida para fora do addEventListener DOMContentLoaded
// para ser global e acessível via onclick no HTML.

// Removido o addEventListener do toggle-btn daqui pois será adicionado dentro do DOMContentLoaded.
// document.querySelector('.toggle-btn')?.addEventListener('click', toggleSidebar);

document.addEventListener('click', e => {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.querySelector('.toggle-btn'); // Obtenha a referência aqui também

  if (!sidebar.classList.contains('collapsed') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
    sidebar.classList.add('collapsed');
    // Adicionar um delay ou um evento para garantir que o label do dark mode seja atualizado
    // setTimeout(() => { if (darkModeLabel) darkModeLabel.style.opacity = '0'; }, 300); // Exemplo
  }
});

document.getElementById('logout-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

// O MutationObserver para configSection já foi movido para dentro do DOMContentLoaded acima.
// const configSection = document.getElementById('configuracoes');
// if (configSection) { ... }

// O listener DOMContentLoaded já foi movido para o topo do script.
// document.addEventListener('DOMContentLoaded', () => { renderCentrais(); });