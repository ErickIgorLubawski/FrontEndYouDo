(function checkAuthentication() {
  const token = localStorage.getItem('token');

  if (!token) {
    // Se NÃO HÁ token salvo...

    // 1. (Opcional, mas recomendado) Mostra um alerta para o usuário entender o que aconteceu.
    alert('Acesso negado. Por favor, faça o login para continuar.');

    // 2. Redireciona IMEDIATAMENTE para a página de login.
    window.location.href = 'login.html';
  }
  
})();
import './auth.js';
import { fetchCentrais, fetchEquipamentos, fetchClientes } from './api/routes.js';
const modalOverlay = document.getElementById('acessos-modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const acessosListContainer = document.getElementById('acessos-list-container');
const modalTitle = document.getElementById('modal-title');
// ---------------------------------------- EVENTOS DO MENU LATERAL  ----------------------------------------


// Centrais
document.querySelector('.sidebar li.centrais')?.addEventListener('click', () => {
  //console.log('DEBUG: Clique em Centrais detectado');
  showSection('centrais');  // mostra a seção correta
  renderCentrais();
});
// Equipamentos
document.querySelector('.sidebar li.equipamento')?.addEventListener('click', () => {
  //console.log('DEBUG: Clique em Equipamentos detectado');
  showSection('equipamentos'); // torna a seção visível
  renderEquipamentos();
});
//clientes
document.querySelector('.sidebar li.clientes')?.addEventListener('click', () => {
 // console.log('DEBUG: Clique em Equipamentos clientes');
  showSection('clientes'); // torna a seção visível
  renderClientes();
});

function openAcessosModal(clienteNome, acessos) {
  modalTitle.textContent = `Acessos de ${clienteNome}`;
  acessosListContainer.innerHTML = ''; // Limpa a lista anterior

  if (acessos && acessos.length > 0) {
    const ul = document.createElement('ul');
    acessos.forEach(acesso => {
      const li = document.createElement('li');
      const begin = new Date(acesso.begin_time).toLocaleString('pt-BR') || 'início?';
      const end = new Date(acesso.end_time).toLocaleString('pt-BR') || 'fim?';
      const central = acesso.central || '?';
      li.textContent = `${begin} → ${end} (Central ${central})`;
      ul.appendChild(li);
    });
    acessosListContainer.appendChild(ul);
  } else {
    acessosListContainer.innerHTML = '<p>Nenhum acesso registrado.</p>';
  }
  
  modalOverlay.classList.add('active');
}
function closeModal() {
  modalOverlay.classList.remove('active');
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (event) => {
  if (event.target === modalOverlay) { // Fecha só se clicar no fundo
    closeModal();
  }
});
// MOSTRAR SEÇÃO (opcional para outras seções)
function showSection(id) {
  document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.sidebar nav ul li').forEach(li => li.classList.remove('active'));
  const current = document.querySelector(`li.${id}`);
  if (current) current.classList.add('active');
}
// RENDERIZAÇÃO DAS CENTRAIS (mantida conforme padrão)
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
      status.className = '_status_14g8r_51 _online_14g8r_57'; 
      status.textContent = c.status; // ou 'online' como estava na imagem
      header.append(title, status);
      
      const content = document.createElement('div');
      
      const icon = document.createElement('div');
      icon.className = '_controllerIcon_14g8r_67';
      
      // Linha antiga: icon.textContent = '🏢';
      // ▼▼▼ LINHA ATUALIZADA COM O CÓDIGO SVG ▼▼▼
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="#c8300c" viewBox="0 0 256 256"><path d="M248,210H230V94h2a6,6,0,0,0,0-12H182V46h2a6,6,0,0,0,0-12H40a6,6,0,0,0,0,12h2V210H24a6,6,0,0,0,0,12H248a6,6,0,0,0,0-12ZM218,94V210H182V94ZM54,46H170V210H142V160a6,6,0,0,0-6-6H88a6,6,0,0,0-6,6v50H54Zm76,164H94V166h36ZM74,80a6,6,0,0,1,6-6H96a6,6,0,0,1,0,12H80A6,6,0,0,1,74,80Zm48,0a6,6,0,0,1,6-6h16a6,6,0,0,1,0,12H128A6,6,0,0,1,122,80ZM80,126a6,6,0,0,1,0-12H96a6,6,0,0,1,0,12Zm42-6a6,6,0,0,1,6-6h16a6,6,0,0,1,0,12H128A6,6,0,0,1,122,120Z"></path></svg>`;
      
      const location = document.createElement('p');
      // Para um visual mais limpo, podemos remover o prefixo "Localização:"
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
// RENDERIZAÇÃO DOS EQUIPAMENTOS (DINÂMICO COM API)
async function renderEquipamentos() {
  console.log('DEBUG: Iniciando renderEquipamentos'); // Corrigido de 'renderCentrais' para 'renderEquipamentos'
  const equipList = document.getElementById('equipamentos-list');
  if (!equipList) return;
  
  equipList.replaceChildren();
  try {
    const { resp = [] } = await fetchEquipamentos();
    
    resp.forEach(e => {
      const card = document.createElement('div');
      card.className = '_card_14g8r_30 equipment-card';
      
      // Header: mostra somente ID acima do ícone
      const header = document.createElement('div');
      header.className = '_cardHeader_14g8r_44';
      const idElem = document.createElement('p');
      idElem.className = 'equipment-id';
      idElem.textContent = e.device_id; // só o número
      
      const iconElem = document.createElement('div');
      iconElem.className = '_controllerIcon_14g8r_67';
      
      // Linha antiga: iconElem.textContent = '🤳';
      // ▼▼▼ LINHA ATUALIZADA COM O NOVO ÍCONE SVG ▼▼▼
      iconElem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="#c8300c" viewBox="0 0 256 256"><path d="M222,40V76a6,6,0,0,1-12,0V46H180a6,6,0,0,1,0-12h36A6,6,0,0,1,222,40Zm-6,134a6,6,0,0,0-6,6v30H180a6,6,0,0,0,0,12h36a6,6,0,0,0,6-6V180A6,6,0,0,0,216,174ZM76,210H46V180a6,6,0,0,0-12,0v36a6,6,0,0,0,6,6H76a6,6,0,0,0,0-12ZM40,82a6,6,0,0,0,6-6V46H76a6,6,0,0,0,0-12H40a6,6,0,0,0-6,6V76A6,6,0,0,0,40,82Zm136,92a6,6,0,0,1-4.8-2.4,54,54,0,0,0-86.4,0,6,6,0,1,1-9.6-7.2,65.65,65.65,0,0,1,29.69-22.26,38,38,0,1,1,46.22,0A65.65,65.65,0,0,1,180.8,164.4,6,6,0,0,1,176,174Zm-48-36a26,26,0,1,0-26-26A26,26,0,0,0,128,138Z"></path></svg>`;
      
      header.append(idElem, iconElem);
      
      // Título e status
      const title = document.createElement('h3');
      title.textContent = e.device_hostname;
      const status = document.createElement('span');
      status.className = '_status_14g8r_51 status ativo'; // Adicionei a classe 'ativo' para padronizar
      status.textContent = 'ativo';
      
      // Body: cada linha em dd único sem repetir label para ID
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
async function renderClientes() {
  const tbody = document.getElementById('clientes-tbody');
  if (!tbody) {
    console.warn('WARNING: #clientes-tbody não encontrado');
    return;
  }
  tbody.innerHTML = '';

  // Adiciona um listener de eventos na tabela inteira (mais eficiente)
  tbody.addEventListener('click', (event) => {
    if (event.target.classList.contains('view-acessos-btn')) {
      const clienteNome = event.target.dataset.clienteNome;
      const acessos = JSON.parse(event.target.dataset.acessos);
      openAcessosModal(clienteNome, acessos);
    }
  });

  try {
    // 1. Buscamos a lista completa de clientes, como antes.
    const { resp: todosClientes = [] } = await fetchClientes();
    
    if (!todosClientes.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'Nenhum cliente encontrado.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    // 2. AGRUPANDO OS CLIENTES POR CENTRAL
    // Vamos criar um objeto para organizar os clientes. Ex: { "Central A": [cliente1, cliente2], "Central B": [cliente3] }
    const clientesPorCentral = {};

    todosClientes.forEach(cliente => {
      if (cliente.acessos && cliente.acessos.length > 0) {
        cliente.acessos.forEach(acesso => {
          const centralNome = acesso.central || 'Central Desconhecida';

          // Se a central ainda não existe no nosso objeto, criamos a lista para ela
          if (!clientesPorCentral[centralNome]) {
            clientesPorCentral[centralNome] = [];
          }

          // Para evitar duplicar o mesmo cliente na mesma central, verificamos se ele já foi adicionado
          const clienteJaAdicionado = clientesPorCentral[centralNome].some(c => c.id === cliente.id);
          if (!clienteJaAdicionado) {
            clientesPorCentral[centralNome].push(cliente);
          }
        });
      }
    });

    // 3. RENDERIZANDO A TABELA AGRUPADA
    // Agora, em vez de iterar na lista de clientes, iteramos no nosso objeto de grupos.
    for (const centralNome in clientesPorCentral) {
      // Cria a linha de cabeçalho para o grupo
      const headerRow = document.createElement('tr');
      headerRow.className = 'group-header';
      const headerCell = document.createElement('td');
      headerCell.colSpan = 6; // Ocupa todas as 6 colunas
      headerCell.textContent = centralNome;
      headerRow.appendChild(headerCell);
      tbody.appendChild(headerRow);

      // Pega a lista de clientes para esta central
      const clientesDoGrupo = clientesPorCentral[centralNome];

      // Renderiza cada cliente dentro do seu grupo
      clientesDoGrupo.forEach(cliente => {
        const tr = document.createElement('tr');
        
        // Colunas ID, Nome, Bio...
        tr.innerHTML = `
          <td>${cliente.idYD || '-'}</td>
          <td>${cliente.name || '-'}</td>
          <td>${cliente.bio || '-'}</td>
        `;

        // Célula de Acessos (com o botão para o modal)
        const tdAcessos = document.createElement('td');
        const totalAcessos = cliente.acessos?.length || 0;
        
        if (totalAcessos > 0) {
          const button = document.createElement('button');
          button.className = 'view-acessos-btn';
          button.textContent = `${totalAcessos} Acesso(s)`;
          button.dataset.acessos = JSON.stringify(cliente.acessos); 
          button.dataset.clienteNome = cliente.name || 'Cliente';
          tdAcessos.appendChild(button);
        } else {
          tdAcessos.textContent = 'Nenhum acesso';
        }
        tr.appendChild(tdAcessos);

        // Colunas Criado em, Atualizado em...
        tr.innerHTML += `
          <td>${cliente.createdAt ? new Date(cliente.createdAt).toLocaleString('pt-BR') : '-'}</td>
          <td>${cliente.updatedAt ? new Date(cliente.updatedAt).toLocaleString('pt-BR') : '-'}</td>
        `;

        tbody.appendChild(tr);
      });
    }

  } catch (err) {
    console.error('ERROR: Falha ao carregar clientes:', err);
    // ... (código de erro)
  }
}

// ---------------------------------------- MENU LATERAL  ----------------------------------------
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}
document.querySelector('.toggle-btn')?.addEventListener('click', toggleSidebar);

document.querySelector('.toggle-btn')?.addEventListener('click', toggleSidebar);
// Fecha o sidebar se o usuário clicar em qualquer lugar fora dele
// fecha o sidebar se o clique NÃO for dentro dele nem no toggle-btn
document.addEventListener('click', e => {
  const sidebar   = document.getElementById('sidebar');
  const toggleBtn = document.querySelector('.toggle-btn');

  // Se o sidebar NÃO está recolhido E o clique foi fora do sidebar e fora do botão...
  if (!sidebar.classList.contains('collapsed') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
    // ...então recolhe ele.
    sidebar.classList.add('collapsed');
  }
});
 document.getElementById('logout-link')?.addEventListener('click', () => {
     logout(); 
   });

// LOGOUT
// Arquivo: script.js

// Garanta que o listener do logout faça isso:
document.getElementById('logout-link')?.addEventListener('click', (e) => {
  e.preventDefault(); // Impede a navegação imediata do link
  
  // 1. Remove o token do localStorage. Esta é a parte mais importante.
  localStorage.removeItem('token');
  
  // 2. Redireciona para a página de login.
  window.location.href = 'login.html';
});