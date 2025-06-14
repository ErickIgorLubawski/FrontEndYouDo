import './auth.js';
import { fetchCentrais, fetchEquipamentos, fetchClientes } from './api/routes.js';
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
      const title = document.createElement('h3'); title.textContent = c.nomeEdificio;
      const status = document.createElement('span'); status.className = '_status_14g8r_51 _online_14g8r_57'; status.textContent = 'online';
      header.append(title, status);
      
      const content = document.createElement('div');
      const icon = document.createElement('div'); icon.className = '_controllerIcon_14g8r_67'; icon.textContent = '🏢';
      const location = document.createElement('p'); location.textContent = `Localização: ${c.rua}, ${c.numero} - ${c.bairro}`;
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
  console.log('DEBUG: Iniciando renderCentrais')
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
      iconElem.textContent = '🤳';
      header.append(idElem, iconElem);
      
      // Título e status
      const title = document.createElement('h3');
      title.textContent = e.device_hostname;
      const status = document.createElement('span');
      status.className = '_status_14g8r_51 _online_14g8r_57';
      status.textContent = 'ativo';
      
      // Body: cada linha em dd único sem repetir label para ID
      const body = document.createElement('dl');
      body.className = 'equipment-details';
      const fields = [
        ['IP', e.ip],
        ['MAC', e.mac],
        ['Criado em', new Date(e.createdAt).toLocaleString()],
        ['Atualizado em', new Date(e.updatedAt).toLocaleString()]
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
  console.log('DEBUG: Iniciando renderClientes');
  // **FIX**: agora buscando o <tbody id="clientes-tbody">
  const tbody = document.getElementById('clientes-tbody');
  if (!tbody) {
    console.warn('WARNING: #clientes-tbody não encontrado');
    return;
  }

  tbody.innerHTML = ''; // limpa linhas antigas

  try {
    const { resp = [] } = await fetchClientes();
    console.log('DEBUG: Dados de clientes recebidos:', resp);

    if (!resp.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'Nenhum cliente encontrado.';
      td.style.textAlign = 'center';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    resp.forEach(cliente => {
      const tr = document.createElement('tr');

      // ID
      const tdId = document.createElement('td');
      tdId.textContent = cliente.idYD || '-';
      tr.appendChild(tdId);

      // Nome
      const tdNome = document.createElement('td');
      tdNome.textContent = cliente.name || '-';
      tr.appendChild(tdNome);

      // Bio
      const tdBio = document.createElement('td');
      tdBio.textContent = cliente.bio || '-';
      tr.appendChild(tdBio);

      // Acessos
      const tdAcessos = document.createElement('td');
      const totalAcessos = cliente.acessos?.length || 0;
      tdAcessos.innerHTML = `<strong>${totalAcessos}</strong>`;
      if (totalAcessos > 0) {
        const ul = document.createElement('ul');
        ul.className = 'acessos-list';
        cliente.acessos.forEach(acesso => {
          const li = document.createElement('li');
          const begin = acesso.begin_time || 'início?';
          const end = acesso.end_time || 'fim?';
          const central = acesso.central || '?';
          li.textContent = `${begin} → ${end} (Central ${central})`;
          ul.appendChild(li);
        });
        tdAcessos.appendChild(ul);
      }
      tr.appendChild(tdAcessos);

      // Criado em
      const tdCriado = document.createElement('td');
      tdCriado.textContent = cliente.createdAt
        ? new Date(cliente.createdAt).toLocaleString('pt-BR')
        : '-';
      tr.appendChild(tdCriado);

      // Atualizado em
      const tdAtualizado = document.createElement('td');
      tdAtualizado.textContent = cliente.updatedAt
        ? new Date(cliente.updatedAt).toLocaleString('pt-BR')
        : '-';
      tr.appendChild(tdAtualizado);

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('ERROR: Falha ao carregar clientes:', err);
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = 'Erro ao carregar clientes.';
    td.style.color = 'red';
    td.style.textAlign = 'center';
    tr.appendChild(td);
    tbody.appendChild(tr);
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

  if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
    sidebar.classList.add('collapsed');
  }
});


 document.getElementById('logout-link')?.addEventListener('click', () => {
     logout(); 
   });

// LOGOUT
function logout() {
  // apaga o token
  document.cookie = 'token=; path=/; max-age=0';
  // não precisa de window.location.href aqui, pois o <a> já navega para login.html
}