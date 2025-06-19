// script.js

// Autenticação inicial: Verifica se o token existe no localStorage
(function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Acesso negado. Por favor, faça o login para continuar.');
      window.location.href = 'login.html';
    }
  })();
  
  // Importa as funções de API de um arquivo separado
  import './auth.js';
  import { fetchCentrais, fetchEquipamentos as fetchEquipamentosAPI, fetchClientes as fetchClientesAPI } from './api/routes.js';
  
  // Referências aos elementos DOM do modal de acessos
  const modalOverlay = document.getElementById('acessos-modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const acessosListContainer = document.getElementById('acessos-list-container');
  const modalTitle = document.getElementById('modal-title');
  
  // Referências aos elementos DOM do modo escuro
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  const darkModeLabel = document.querySelector('.dark-mode-label');
  
  // Referência ao botão de toggle da sidebar e à própria sidebar
  const toggleSidebarBtn = document.querySelector('.toggle-btn');
  const sidebar = document.getElementById('sidebar');
  
  // Gerenciamento de estado de navegação e breadcrumbs
  let currentPath = [];
  
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
  
  // Função global para toggle da sidebar
  function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    setTimeout(() => {
      if (sidebar.classList.contains('collapsed')) {
        if (darkModeLabel) {
          darkModeLabel.style.opacity = '0';
          darkModeLabel.style.width = '0';
          darkModeLabel.style.overflow = 'hidden';
        }
      } else {
        if (darkModeLabel) {
          darkModeLabel.style.opacity = '1';
          darkModeLabel.style.width = 'auto';
          darkModeLabel.style.overflow = 'visible';
        }
      }
    }, 300);
  }
  
  // Função para atualizar os breadcrumbs no DOM
  function updateBreadcrumbs(activeSectionId) {
    document.querySelectorAll('.breadcrumb-container').forEach(container => {
        container.innerHTML = '';
        container.style.display = 'none';
    });

    const breadcrumbContainer = document.getElementById(`${activeSectionId}-breadcrumb`);
    if (!breadcrumbContainer) return;
    
    breadcrumbContainer.style.display = 'flex'; // Usar flexbox no container

    currentPath.forEach((item, index) => {
        const itemSpan = document.createElement('span');
        itemSpan.className = 'breadcrumb-item';

        let linkText = '';
        let linkParams = {};

        if (item.section === 'centrais') {
            linkText = 'Centrais';
            linkParams = {};
        } else if (item.section === 'equipamentos') {
            linkText = item.centralName || 'Equipamentos';
            linkParams = { centralId: item.centralId, centralName: item.centralName };
        } else if (item.section === 'clientes') {
            linkText = item.equipamentoName || 'Clientes';
            linkParams = {
                centralId: item.centralId,
                centralName: item.centralName,
                equipamentoId: item.equipamentoId,
                equipamentoName: item.equipamentoName
            };
        } else if (item.section === 'configuracoes') {
             linkText = 'Configurações';
             linkParams = {};
        }

        if (index < currentPath.length - 1) {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = linkText;
            link.onclick = (e) => {
                e.preventDefault();
                const newPath = currentPath.slice(0, index + 1);
                currentPath = newPath;
                navigateTo(item.section, linkParams, false);
            };
            itemSpan.appendChild(link);
        } else {
            itemSpan.textContent = linkText;
            itemSpan.classList.add('active');
        }

        breadcrumbContainer.appendChild(itemSpan);

        if (index < currentPath.length - 1) {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            // NOVO: Adicionar SVG como separador (ou um caractere se preferir)
            separator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"/></svg>`; // Seta para a direita
            // Ou, se preferir um caractere: separator.textContent = '›';
            breadcrumbContainer.appendChild(separator);
        }
    });
}
  // Função centralizada de navegação para todas as seções
  function navigateTo(section, params = {}, addToHistory = true) {
      console.log(`DEBUG: navigateTo - Seção: ${section}, Params:`, params, `AddToHistory: ${addToHistory}`);
  
      const newPathItem = { section: section, ...params };
  
      if (addToHistory) {
          let shouldResetPath = false;
  
          // Lógica para redefinir ou ajustar o currentPath com base na navegação
          if (section === 'centrais') {
              shouldResetPath = true; // Sempre reinicia para 'centrais'
          } else if (section === 'equipamentos') {
              const centralInPath = currentPath.find(item => item.section === 'centrais' && item.id === params.centralId);
              if (!centralInPath) {
                  currentPath = [{ section: 'centrais', id: params.centralId, name: params.centralName }];
              } else {
                  const centralIndex = currentPath.findIndex(item => item.section === 'centrais' && item.id === params.centralId);
                  currentPath = currentPath.slice(0, centralIndex + 1);
              }
          } else if (section === 'clientes') { // Para usuários
              const centralInPath = currentPath.find(item => item.section === 'centrais' && item.id === params.centralId);
              const equipamentoInPath = currentPath.find(item => item.section === 'equipamentos' && item.id === params.equipamentoId);
  
              // Reconstroi o caminho até o equipamento
              if (!centralInPath) {
                  currentPath = [{ section: 'centrais', id: params.centralId, name: params.centralName }];
              } else {
                  const centralIndex = currentPath.findIndex(item => item.section === 'centrais' && item.id === params.centralId);
                  currentPath = currentPath.slice(0, centralIndex + 1);
              }
  
              if (!equipamentoInPath) {
                  currentPath.push({ section: 'equipamentos', centralId: params.centralId, centralName: params.centralName, id: params.equipamentoId, name: params.equipamentoName });
              } else {
                  const eqIndex = currentPath.findIndex(item => item.section === 'equipamentos' && item.id === params.equipamentoId);
                  currentPath = currentPath.slice(0, eqIndex + 1);
              }
          } else { // Para seções como 'configuracoes', 'sair'
              shouldResetPath = true;
          }
  
          if (shouldResetPath) {
              currentPath = [newPathItem];
          } else {
              const lastPathItem = currentPath[currentPath.length - 1];
              if (!lastPathItem || lastPathItem.section !== newPathItem.section || JSON.stringify(lastPathItem) !== JSON.stringify(newPathItem)) {
                  currentPath.push(newPathItem);
              }
          }
      }
  
      const urlParams = new URLSearchParams();
      urlParams.append('section', section);
      for (const key in params) {
          if (params.hasOwnProperty(key) && params[key] !== undefined) {
              urlParams.append(key, params[key]);
          }
      }
      const newUrl = `?${urlParams.toString()}`;
  
      if (addToHistory) {
          history.pushState(currentPath, '', newUrl);
      }
  
      showSection(section);
  
      if (section === 'centrais') {
          renderCentrais();
      } else if (section === 'equipamentos') {
          renderEquipamentos(params.centralId, params.centralName);
      } else if (section === 'clientes') {
          // Decide qual função de renderização de clientes chamar
          // Se há um equipamentoId, renderiza usuários filtrados.
          // Se não há, renderiza todos os clientes (com agrupamento por central).
          if (params.equipamentoId) {
              renderUsuarios(params.equipamentoId, params.equipamentoName, params.centralId, params.centralName);
          } else {
              renderClientes(); // Chama a função para listar todos os clientes (com agrupamento)
          }
      } else if (section === 'configuracoes') {
          renderConfiguracoes(); // Adicione esta linha se tiver uma função renderConfiguracoes
      }
  
      updateBreadcrumbs(section);
  }
  
  // Lógica para lidar com os botões "Voltar" e "Avançar" do navegador
  window.addEventListener('popstate', (event) => {
      console.log("DEBUG: popstate event triggered. State:", event.state);
      if (event.state) {
          currentPath = event.state;
          const lastItem = currentPath[currentPath.length - 1];
          if (lastItem) {
              navigateTo(lastItem.section, lastItem, false);
          }
      } else {
          currentPath = [{ section: 'centrais' }];
          navigateTo('centrais', {}, false);
      }
  });
  
  
  document.addEventListener('DOMContentLoaded', () => {
      applyTheme(localStorage.getItem('theme') === 'dark');
  
      // Inicializa a navegação com base na URL ao carregar a página
      const urlParams = new URLSearchParams(window.location.search);
      const initialSection = urlParams.get('section') || 'centrais';
      const initialParams = {};
      for (const [key, value] of urlParams.entries()) {
          if (key !== 'section') {
              initialParams[key] = value;
          }
      }
  
      // Constrói o `currentPath` inicial baseado na URL
      if (initialSection === 'centrais') {
          currentPath = [{ section: 'centrais' }];
      } else if (initialSection === 'equipamentos' && initialParams.centralId) {
          currentPath = [
              { section: 'centrais', id: initialParams.centralId, name: initialParams.centralName },
              { section: 'equipamentos', centralId: initialParams.centralId, centralName: initialParams.centralName }
          ];
      } else if (initialSection === 'clientes' && initialParams.equipamentoId) {
          currentPath = [
              { section: 'centrais', id: initialParams.centralId, name: initialParams.centralName },
              { section: 'equipamentos', centralId: initialParams.centralId, centralName: initialParams.centralName, id: initialParams.equipamentoId, name: initialParams.equipamentoName },
              { section: 'clientes', equipamentoId: initialParams.equipamentoId, equipamentoName: initialParams.equipamentoName, centralId: initialParams.centralId, centralName: initialParams.centralName }
          ];
      } else {
          currentPath = [{ section: 'centrais' }]; // Fallback
      }
  
      // Chama `MapsTo` para renderizar a seção inicial, sem adicionar ao histórico
      navigateTo(initialSection, initialParams, false);
  
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
  
      if (sidebar.classList.contains('collapsed')) {
          if (darkModeLabel) {
              darkModeLabel.style.opacity = '0';
              darkModeLabel.style.width = '0';
              darkModeLabel.style.overflow = 'hidden';
          }
      }
  
      if (toggleSidebarBtn) {
          toggleSidebarBtn.addEventListener('click', (event) => {
              event.stopPropagation();
              toggleSidebar();
          });
      }
  
      // NOVO: Delegação de eventos para o botão "Acessos" (movido para aqui)
      const clientesTbody = document.getElementById('clientes-tbody');
      if (clientesTbody) {
          clientesTbody.addEventListener('click', (event) => {
              const button = event.target.closest('.view-acessos-btn');
              if (button) {
                  const clienteNome = decodeURIComponent(button.dataset.clienteNome); // Decodificar o nome
                  try {
                      const acessos = JSON.parse(decodeURIComponent(button.dataset.acessos)); // Decodificar e parsear o JSON
                      openAcessosModal(clienteNome, acessos);
                  } catch (e) {
                      console.error("Erro ao parsear JSON de acessos:", e);
                      alert("Erro ao carregar detalhes de acessos. Verifique o console.");
                  }
              }
          });
      }
  
      document.addEventListener('click', e => {
        if (!sidebar.classList.contains('collapsed') && !sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
          sidebar.classList.add('collapsed');
          if (darkModeLabel) {
              darkModeLabel.style.opacity = '0';
              darkModeLabel.style.width = '0';
              darkModeLabel.style.overflow = 'hidden';
          }
        }
      });
  
      // ---------------------------------------- EVENTOS DO MENU LATERAL (AJUSTADO) ----------------------------------------
  
      document.querySelector('.sidebar li.centrais')?.addEventListener('click', () => {
        navigateTo('centrais');
      });
  
      document.querySelector('.sidebar li.equipamento')?.addEventListener('click', () => {
        navigateTo('equipamentos');
      });
  
      document.querySelector('.sidebar li.clientes')?.addEventListener('click', () => {
        navigateTo('clientes'); // Chama a rota geral de clientes (sem filtro de equipamento)
      });
  
      document.querySelector('.sidebar li.configuracoes')?.addEventListener('click', () => {
        navigateTo('configuracoes');
      });
  });
  
  // ---------------------------------------- MODAL DE ACESSOS (EXISTENTE) ----------------------------------------
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
  
    const centraisSectionTitle = document.getElementById('centrais-section-title');
    if (centraisSectionTitle) centraisSectionTitle.textContent = 'Centrais';
  
    centralList.innerHTML = '';
    try {
      const { resp = [] } = await fetchCentrais();
      console.log('DEBUG: Dados de centrais recebidos:', resp);
  
      if (resp.length === 0) {
          centralList.innerHTML = '<p>Nenhuma central encontrada.</p>';
          return;
      }
  
      resp.forEach(c => {
        const card = document.createElement('div');
        card.className = '_card_14g8r_30';
        card.dataset.id = c.id;
        card.onclick = () => navigateTo('equipamentos', { centralId: c.id, centralName: c.nomeEdificio });
  
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
  async function renderEquipamentos(centralId = null, centralName = null) {
      console.log(`DEBUG: Iniciando renderEquipamentos para centralId: ${centralId || 'todos'}`);
      const equipList = document.getElementById('equipamentos-list');
      if (!equipList) return console.warn('WARNING: #equipamentos-list não encontrado');
    
      const equipamentosSectionTitle = document.getElementById('equipamentos-section-title');
      if (equipamentosSectionTitle) {
          equipamentosSectionTitle.textContent = centralName ? `Equipamentos da Central: ${centralName}` : 'Todos os Equipamentos';
      }
    
      equipList.innerHTML = '';
      try {
        let resp = [];
        if (centralId) {
            const { resp: fetchedEquipamentos = [] } = await fetchEquipamentosAPI(centralId);
            resp = fetchedEquipamentos;
        } else {
            const { resp: allEquipamentos = [] } = await fetchEquipamentosAPI();
            resp = allEquipamentos;
        }
    
        console.log('DEBUG: Dados de equipamentos recebidos:', resp);
    
        if (resp.length === 0) {
            equipList.innerHTML = centralId ? '<p>Nenhum equipamento encontrado para esta central.</p>' : '<p>Nenhum equipamento encontrado.</p>';
            return;
        }
    
        resp.forEach(e => {
          const card = document.createElement('div');
          card.className = '_card_14g8r_30 equipment-card';
          card.dataset.id = e.id;
          card.onclick = () => navigateTo('clientes', {
              centralId: centralId,
              centralName: centralName,
              equipamentoId: e.device_id, // Passando o device_id do equipamento
              equipamentoName: e.device_hostname
          });
    
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
        console.error('ERROR: Falha ao carregar equipamentos:', err);
        equipList.innerHTML = '<p>Erro ao carregar equipamentos.</p>';
      }
    }
  
  // RENDERIZAÇÃO DOS USUÁRIOS (Clientes) - NOVO: Usado para navegação hierárquica
  async function renderUsuarios(equipamentoId = null, equipamentoName = null, centralId = null, centralName = null) {
      console.log(`DEBUG: Iniciando renderUsuarios para equipamentoId: ${equipamentoId || 'todos'}`);
      const tbody = document.getElementById('clientes-tbody');
      if (!tbody) {
          console.warn('WARNING: #clientes-tbody não encontrado');
          return;
      }
  
      const clientesSectionTitle = document.getElementById('clientes-section-title');
      if (clientesSectionTitle) {
          clientesSectionTitle.textContent = equipamentoName ? `Clientes do Equipamento: ${equipamentoName}` : 'Todos os Clientes';
      }
  
      tbody.innerHTML = '';
  
      try {
          let clientes = [];
          if (equipamentoId) {
              const { resp: fetchedUsers = [] } = await fetchClientesAPI(equipamentoId);
              clientes = fetchedUsers;
          } else {
              const { resp: allUsers = [] } = await fetchClientesAPI();
              clientes = allUsers;
          }
  
          console.log('DEBUG: Dados de clientes/usuários recebidos:', clientes);
  
          if (!clientes.length) {
              const tr = document.createElement('tr');
              const td = document.createElement('td');
              td.colSpan = 5;
              td.textContent = equipamentoId ? 'Nenhum cliente encontrado para este equipamento.' : 'Nenhum cliente encontrado.';
              td.style.textAlign = 'center';
              tr.appendChild(td);
              tbody.appendChild(tr);
              return;
          }
  
          clientes.forEach(cliente => {
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
  
      } catch (err) {
          console.error('ERROR: Falha ao carregar clientes/usuários:', err);
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
  
  // RENDERIZAÇÃO DOS CLIENTES (ORIGINAL) - Mantida para o clique no menu lateral 'Clientes'
  // Esta função agrupa por central e lista todos os clientes, sem filtro por equipamento.
  async function renderClientes() {
      const tbody = document.getElementById('clientes-tbody');
      if (!tbody) {
          console.warn('WARNING: #clientes-tbody não encontrado');
          return;
      }
  
      const clientesSectionTitle = document.getElementById('clientes-section-title');
      if (clientesSectionTitle) clientesSectionTitle.textContent = 'Clientes';
  
      tbody.innerHTML = '';
  
      try {
          const { resp: todosClientes = [] } = await fetchClientesAPI();
          console.log('DEBUG: Dados de clientes recebidos (geral):', todosClientes);
  
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
  
  
  // ---------------------------------------- LÓGICA DE LOGOUT (EXISTENTE) ----------------------------------------
  document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  });