// script.js

// Autenticação inicial: Verifica se o token existe no localStorage
(function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Acesso negado. Por favor, faça o login para continuar.');
        window.location.href = 'login.html';
    }
})();

// Importa as funções de API
import './auth.js';
import { fetchCentrais, fetchEquipamentos as fetchEquipamentosAPI, fetchClientes as fetchClientesAPI } from './api/routes.js';

// Referências aos elementos DOM do modal e tema
const modalOverlay = document.getElementById('acessos-modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const acessosListContainer = document.getElementById('acessos-list-container');
const modalTitle = document.getElementById('modal-title');
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;
const darkModeLabel = document.querySelector('.dark-mode-label');
const toggleSidebarBtn = document.querySelector('.toggle-btn');
const sidebar = document.getElementById('sidebar');

// Gerenciamento de estado de navegação e breadcrumbs
let currentPath = [];

// Cache para Centrais e Equipamentos (para evitar re-fetchs constantes)
let allCentraisData = [];
let allEquipamentosData = [];


// --- Funções de Utilitário ---

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

function showSection(id) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    document.querySelectorAll('.sidebar nav ul li').forEach(li => li.classList.remove('active'));
    const current = document.querySelector(`li.${id}`);
    if (current) current.classList.add('active');
}

// --- Funções do Modal ---
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


// --- Funções de População de ListBoxes ---

function populateCentralFilter(centrais, selectedCentralId, targetSelectElement) {
    if (!targetSelectElement) {
        console.warn('WARNING: Elemento select para centrais não encontrado para população.');
        return;
    }

    targetSelectElement.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todas as Centrais';
    targetSelectElement.appendChild(defaultOption);

    centrais.forEach(central => {
        const option = document.createElement('option');
        option.value = central.id;
        option.textContent = central.nomeEdificio;
        targetSelectElement.appendChild(option);
    });

    targetSelectElement.value = selectedCentralId || '';
}

async function populateEquipamentoFilter(equipamentosList, selectedEquipamentoId, targetSelectElement) {
    if (!targetSelectElement) {
        console.warn('WARNING: Elemento select para equipamentos não encontrado para população.');
        return;
    }

    targetSelectElement.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todos os Equipamentos';
    targetSelectElement.appendChild(defaultOption);

    equipamentosList.forEach(equipamento => {
        const option = document.createElement('option');
        option.value = equipamento.device_id;
        option.textContent = equipamento.device_hostname;
        targetSelectElement.appendChild(option);
    });

    targetSelectElement.value = selectedEquipamentoId || '';
}


// --- Handlers de Filtro para ListBoxes (Delegados no DOMContentLoaded) ---

function handleCentralFilterChange(event) {
    const selectedCentralId = event.target.value;
    const selectedCentralName = event.target.options[event.target.selectedIndex].text;

    const currentSection = currentPath[currentPath.length - 1]?.section;

    if (currentSection === 'equipamentos') {
        navigateTo('equipamentos', { centralId: selectedCentralId, centralName: selectedCentralName });
    } else if (currentSection === 'clientes') {
        // Ao mudar a central na tela de clientes, resetar filtro de equipamento
        navigateTo('clientes', { centralId: selectedCentralId, centralName: selectedCentralName, equipamentoId: null, equipamentoName: null });
    }
}

function handleEquipamentoFilterChange(event) {
    const selectedEquipamentoId = event.target.value;
    const selectedEquipamentoName = event.target.options[event.target.selectedIndex].text;

    const currentCentralPathItem = currentPath.find(item => item.section === 'centrais' || item.centralId);
    const currentCentralId = currentCentralPathItem?.id || currentCentralPathItem?.centralId || null;
    const currentCentralName = currentCentralPathItem?.name || currentCentralPathItem?.centralName || null;

    if (currentCentralId) {
        navigateTo('clientes', {
            centralId: currentCentralId,
            centralName: currentCentralName,
            equipamentoId: selectedEquipamentoId,
            equipamentoName: selectedEquipamentoName
        });
    } else {
        console.warn("Tentativa de filtrar equipamento sem central selecionada.");
        // Se a central não está selecionada, o filtro de equipamento pode ser irrelevante
        // Ou você pode optar por listar todos os usuários, ou usuários de todos os equipamentos
        // Por agora, vamos para a listagem geral de clientes
        navigateTo('clientes');
    }
}


// --- Funções de Navegação e Renderização ---

// CORRIGIDO: updateBreadcrumbs - Não cria links, apenas spans visuais
function updateBreadcrumbs(activeSectionId) {
    document.querySelectorAll('.breadcrumb-container').forEach(container => {
        container.innerHTML = '';
        container.style.display = 'none'; // Esconde todos por padrão
    });

    const breadcrumbContainer = document.getElementById(`${activeSectionId}-breadcrumb`);
    if (!breadcrumbContainer) return;

    breadcrumbContainer.style.display = 'flex'; // Mostra apenas o container da seção ativa

    currentPath.forEach((item, index) => {
        const itemSpan = document.createElement('span');
        itemSpan.className = 'breadcrumb-item';

        let linkText = '';
        if (item.section === 'centrais') {
            linkText = 'Centrais';
        } else if (item.section === 'equipamentos') {
            linkText = item.centralName || 'Equipamentos';
        } else if (item.section === 'clientes') {
            linkText = item.equipamentoName || 'Clientes';
        } else if (item.section === 'configuracoes') {
             linkText = 'Configurações';
        }

        // NOVO: Sem links clicáveis no breadcrumb
        itemSpan.textContent = linkText;
        if (index === currentPath.length - 1) { // Último item é o ativo
            itemSpan.classList.add('active');
        }
        // Remover cursor: pointer se a intenção é que não seja clicável
        itemSpan.style.cursor = 'default';

        breadcrumbContainer.appendChild(itemSpan);

        if (index < currentPath.length - 1) {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z"/></svg>`;
            breadcrumbContainer.appendChild(separator);
        }
    });
}

function navigateTo(section, params = {}, addToHistory = true) {
    console.log(`DEBUG: navigateTo - Seção: ${section}, Params:`, params, `AddToHistory: ${addToHistory}`);

    const newPathItem = { section: section, ...params };

    if (addToHistory) {
        // CORRIGIDO: Lógica mais robusta para gerenciar o currentPath
        let tempPath = [];
        if (section === 'centrais') {
            tempPath.push({ section: 'centrais' });
        } else if (section === 'equipamentos') {
            // Garante que 'centrais' esteja no caminho antes de 'equipamentos'
            if (params.centralId && params.centralName) {
                tempPath.push({ section: 'centrais', id: params.centralId, name: params.centralName });
            }
            tempPath.push(newPathItem);
        } else if (section === 'clientes') { // Usuários
            // Garante que 'centrais' e 'equipamentos' estejam no caminho antes de 'clientes'
            if (params.centralId && params.centralName) {
                tempPath.push({ section: 'centrais', id: params.centralId, name: params.centralName });
            }
            if (params.equipamentoId && params.equipamentoName) {
                 tempPath.push({ section: 'equipamentos', centralId: params.centralId, centralName: params.centralName, id: params.equipamentoId, name: params.equipamentoName });
            }
            tempPath.push(newPathItem);
        } else { // Para seções como 'configuracoes', 'sair'
            tempPath.push(newPathItem);
        }
        currentPath = tempPath.filter(Boolean);
    }

    const urlParams = new URLSearchParams();
    urlParams.append('section', section);
    for (const key in params) {
        if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
            urlParams.append(key, params[key]);
        }
    }
    const newUrl = `?${urlParams.toString()}`;

    if (addToHistory) {
        history.pushState(currentPath, '', newUrl);
    }

    showSection(section);

    // CHAMA AS FUNÇÕES DE RENDERIZAÇÃO (agora renderUsuarios lida com seus próprios listboxes)
    if (section === 'centrais') {
        renderCentrais();
    } else if (section === 'equipamentos') {
        renderEquipamentos(params.centralId, params.centralName);
    } else if (section === 'clientes') {
        renderUsuarios(params.equipamentoId, params.equipamentoName, params.centralId, params.centralName);
    } else if (section === 'configuracoes') {
        renderConfiguracoes();
    }

    //updateBreadcrumbs(section); // Chamado ao final para refletir o estado atual
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


// --- Funções de Renderização de Seções ---

async function renderCentrais() {
    console.log('DEBUG: Iniciando renderCentrais');
    const centralList = document.getElementById('centrais-list');
    if (!centralList) return console.warn('WARNING: #centrais-list não encontrado');

    // CORRIGIDO: Esconder ListBox na tela de Centrais
    const centralSelectFilterEquipamentos = document.getElementById('central-select-filter');
    if (centralSelectFilterEquipamentos) {
        centralSelectFilterEquipamentos.style.display = 'none';
        centralSelectFilterEquipamentos.parentElement.style.display = 'none'; // Esconde o container também
    }
    // CORRIGIDO: Remover ListBoxes da tela de clientes se estiverem lá (garante limpeza)
    const clientesFilterContainer = document.querySelector('#clientes .filter-container');
    if (clientesFilterContainer) {
        clientesFilterContainer.innerHTML = '';
        clientesFilterContainer.style.display = 'none';
    }


    const centraisSectionTitle = document.getElementById('centrais-section-title');
    if (centraisSectionTitle) centraisSectionTitle.textContent = 'Centrais';

    centralList.innerHTML = '';
    try {
        if (allCentraisData.length === 0) { // Carrega se não estiver em cache
            const { resp = [] } = await fetchCentrais();
            allCentraisData = resp;
        }
        console.log('DEBUG: Dados de centrais recebidos:', allCentraisData);

        if (allCentraisData.length === 0) {
            centralList.innerHTML = '<p>Nenhuma central encontrada.</p>';
            return;
        }

        allCentraisData.forEach(c => {
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

async function renderEquipamentos(centralId = null, centralName = null) {
    console.log(`DEBUG: Iniciando renderEquipamentos para centralId: ${centralId || 'todos'}`);
    const equipList = document.getElementById('equipamentos-list');
    const centralSelectFilter = document.getElementById('central-select-filter');

    // CORRIGIDO: Remover ListBoxes da tela de clientes se estiverem lá (garante limpeza)
    const clientesFilterContainer = document.querySelector('#clientes .filter-container');
    if (clientesFilterContainer) {
        clientesFilterContainer.innerHTML = '';
        clientesFilterContainer.style.display = 'none';
    }


    if (!equipList || !centralSelectFilter) {
      console.warn('WARNING: Elementos de equipamentos ou filtro não encontrados. Pulando renderização de equipamentos.');
      return;
    }

    const equipamentosSectionTitle = document.getElementById('equipamentos-section-title');
    if (equipamentosSectionTitle) {
        equipamentosSectionTitle.textContent = centralName ? `Equipamentos da Central: ${centralName}` : 'Todos os Equipamentos';
    }

    equipList.innerHTML = ''; // Limpa a lista antes de renderizar

    try {
        // Mostrar o ListBox na tela de equipamentos
        centralSelectFilter.style.display = 'block';
        centralSelectFilter.parentElement.style.display = 'flex'; // Mostrar o container

        // Popula o ListBox aqui
        if (allCentraisData.length === 0) { // Garante que cache esteja populado
            const { resp = [] } = await fetchCentrais();
            allCentraisData = resp;
        }
        populateCentralFilter(allCentraisData, centralId, centralSelectFilter);

        let resp = [];
        if (centralId) {
            const { resp: fetchedEquipamentos = [] } = await fetchEquipamentosAPI(centralId);
            resp = fetchedEquipamentos;
        } else {
            const { resp: allEquipamentos = [] } = await fetchEquipamentosAPI();
            resp = allEquipamentos;
        }
        allEquipamentosData = resp; // Cacheia todos os equipamentos carregados

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
                equipamentoId: e.device_id,
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

async function renderUsuarios(equipamentoId = null, equipamentoName = null, centralId = null, centralName = null) {
    console.log(`DEBUG: Iniciando renderUsuarios para equipamentoId: ${equipamentoId || 'todos'}, centralId: ${centralId || 'todos'}`);
    const tbody = document.getElementById('clientes-tbody');

    // CORRIGIDO: Garantir que os elementos select existam antes de tentar referenciá-los
    let centralSelectFilterClientes = document.getElementById('central-select-filter-clientes');
    let equipamentoSelectFilterClientes = document.getElementById('equipamento-select-filter-clientes');

    let filterContainer = document.querySelector('#clientes .filter-container');
    if (!filterContainer) {
        filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        document.getElementById('clientes').insertBefore(filterContainer, document.getElementById('clientes-section-title').nextSibling);
    }
    filterContainer.innerHTML = ''; // Limpa o container para adicionar os selects

    // Se os selects não existem, crie-os
    if (!centralSelectFilterClientes) {
        centralSelectFilterClientes = document.createElement('select');
        centralSelectFilterClientes.id = 'central-select-filter-clientes';
        centralSelectFilterClientes.className = 'filter-select';
    }
    if (!equipamentoSelectFilterClientes) {
        equipamentoSelectFilterClientes = document.createElement('select');
        equipamentoSelectFilterClientes.id = 'equipamento-select-filter-clientes';
        equipamentoSelectFilterClientes.className = 'filter-select';
    }

    // Mostrar o container e os selects
    filterContainer.style.display = 'flex';
    centralSelectFilterClientes.style.display = 'block';
    equipamentoSelectFilterClientes.style.display = 'block';

    // Adicionar labels para acessibilidade
    const labelCentral = document.createElement('label');
    labelCentral.setAttribute('for', 'central-select-filter-clientes');
    labelCentral.textContent = 'Filtrar por Central:';
    labelCentral.classList.add('sr-only');

    const labelEquipamento = document.createElement('label');
    labelEquipamento.setAttribute('for', 'equipamento-select-filter-clientes');
    labelEquipamento.textContent = 'Filtrar por Equipamento:';
    labelEquipamento.classList.add('sr-only');

    filterContainer.appendChild(labelCentral);
    filterContainer.appendChild(centralSelectFilterClientes);
    filterContainer.appendChild(labelEquipamento);
    filterContainer.appendChild(equipamentoSelectFilterClientes);


    // CORRIGIDO: Esconder ListBox da tela de equipamentos se estiver lá (garante limpeza)
    const centralSelectFilterEquipamentos = document.getElementById('central-select-filter');
    if (centralSelectFilterEquipamentos) {
        centralSelectFilterEquipamentos.style.display = 'none';
        centralSelectFilterEquipamentos.parentElement.style.display = 'none';
    }


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
        // Popula o ListBox de centrais
        if (allCentraisData.length === 0) { // Garante que cache esteja populado
            const { resp = [] } = await fetchCentrais();
            allCentraisData = resp;
        }
        populateCentralFilter(allCentraisData, centralId, centralSelectFilterClientes);

        // Popula o ListBox de equipamentos com base na central selecionada
        let equipamentosParaListBox = [];
        if (centralId) {
            // Se o cache de allEquipamentosData não estiver populado, busca (pode ser uma busca geral ou por central)
            if (allEquipamentosData.length === 0) {
                 const { resp = [] } = await fetchEquipamentosAPI(); // Busca todos para cache
                 allEquipamentosData = resp;
            }
            equipamentosParaListBox = allEquipamentosData.filter(eq => eq.central_id === centralId);
        } else {
            // Se nenhuma central selecionada, pode listar todos os equipamentos (ou nenhum)
            // Para "Todos os Equipamentos" como opção para ListBox, use allEquipamentosData
            if (allEquipamentosData.length === 0) {
                const { resp = [] } = await fetchEquipamentosAPI(); // Busca todos para cache
                allEquipamentosData = resp;
            }
            equipamentosParaListBox = allEquipamentosData;
        }
        populateEquipamentoFilter(equipamentosParaListBox, equipamentoId, equipamentoSelectFilterClientes);


        let clientes = [];
        if (equipamentoId) {
            const { resp: fetchedUsers = [] } = await fetchClientesAPI(equipamentoId);
            clientes = fetchedUsers;
        } else if (centralId) {
            // FILTRO NO FRONT para central_id, pois não há endpoint de backend para isso
            const { resp: allUsers = [] } = await fetchClientesAPI();
            clientes = allUsers.filter(user => user.acessos.some(acesso => acesso.central === centralId));
        } else {
            const { resp: allUsers = [] } = await fetchClientesAPI();
            clientes = allUsers;
        }

        console.log('DEBUG: Dados de clientes/usuários recebidos:', clientes);

        if (!clientes.length) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 5;
            td.textContent = (equipamentoId || centralId) ? 'Nenhum cliente encontrado com estes filtros.' : 'Nenhum cliente encontrado.';
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
                const acessosString = encodeURIComponent(JSON.stringify(cliente.acessos));
                const clienteNomeString = encodeURIComponent(cliente.name || 'Cliente');
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

// RENDERIZAÇÃO DOS CLIENTES (ORIGINAL)
async function renderClientes() {
    const tbody = document.getElementById('clientes-tbody');

    // CORRIGIDO: Remover os listboxes da tela de clientes gerais, se houver
    const filterContainer = document.querySelector('#clientes .filter-container');
    if (filterContainer) {
        filterContainer.innerHTML = '';
        filterContainer.style.display = 'none'; // Esconde o container
    }
    // CORRIGIDO: Esconder ListBox da tela de equipamentos se estiver lá (garante limpeza)
    const centralSelectFilterEquipamentos = document.getElementById('central-select-filter');
    if (centralSelectFilterEquipamentos) {
        centralSelectFilterEquipamentos.style.display = 'none';
        centralSelectFilterEquipamentos.parentElement.style.display = 'none';
    }


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
                    const acessosString = encodeURIComponent(JSON.stringify(cliente.acessos));
                    const clienteNomeString = encodeURIComponent(cliente.name || 'Cliente');
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

async function renderConfiguracoes() {
    console.log('DEBUG: Iniciando renderConfiguracoes');
    const configSection = document.getElementById('configuracoes');
    if (configSection) {
        const configSectionTitle = document.getElementById('configuracoes-section-title');
        if (configSectionTitle) configSectionTitle.textContent = 'Configurações';
    }

    // CORRIGIDO: Esconder ListBoxes de outras seções quando em configurações
    const centralSelectFilterEquipamentos = document.getElementById('central-select-filter');
    if (centralSelectFilterEquipamentos) {
        centralSelectFilterEquipamentos.style.display = 'none';
        centralSelectFilterEquipamentos.parentElement.style.display = 'none';
    }
    const clientesFilterContainer = document.querySelector('#clientes .filter-container');
    if (clientesFilterContainer) {
        clientesFilterContainer.innerHTML = '';
        clientesFilterContainer.style.display = 'none';
    }
}

// ---------------------------------------- LÓGICA DE LOGOUT ----------------------------------------
document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});


// ---------------------------------------- DOMContentLoaded Listener Principal ----------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(localStorage.getItem('theme') === 'dark');

    // Pré-carregar dados iniciais e armazena em cache
    try {
        const { resp: centraisResp = [] } = await fetchCentrais();
        allCentraisData = centraisResp;
        console.log('Centrais pré-carregadas para cache:', allCentraisData);
    } catch (error) {
        console.error('Erro ao pré-carregar centrais:', error);
        alert('Erro ao carregar dados iniciais das centrais. Verifique sua conexão ou API.');
    }

    try {
        const { resp: equipamentosResp = [] } = await fetchEquipamentosAPI();
        allEquipamentosData = equipamentosResp;
        console.log('Equipamentos pré-carregados para cache:', allEquipamentosData);
    } catch (error) {
        console.error('Erro ao pré-carregar equipamentos:', error);
    }

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
    // A lógica de navigateTo vai ajustar isso mais precisamente
    currentPath = [{ section: initialSection, ...initialParams }];

    navigateTo(initialSection, initialParams, false);

    // Observador para a seção de configurações (já existia)
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

    // Listener para o Dark Mode Toggle (já existia)
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            applyTheme(darkModeToggle.checked);
        });
    }

    // Lógica para esconder/mostrar o label do dark mode ao carregar (já existia)
    if (sidebar.classList.contains('collapsed')) {
        if (darkModeLabel) {
            darkModeLabel.style.opacity = '0';
            darkModeLabel.style.width = '0';
            darkModeLabel.style.overflow = 'hidden';
        }
    }

    // Listener para o botão de toggle da sidebar (já existia)
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleSidebar();
        });
    }

    // Delegação de eventos para o botão "Acessos" (já existia)
    const clientesTbody = document.getElementById('clientes-tbody');
    if (clientesTbody) {
        clientesTbody.addEventListener('click', (event) => {
            const button = event.target.closest('.view-acessos-btn');
            if (button) {
                const clienteNome = decodeURIComponent(button.dataset.clienteNome);
                try {
                    const acessos = JSON.parse(decodeURIComponent(button.dataset.acessos));
                    openAcessosModal(clienteNome, acessos);
                } catch (e) {
                    console.error("Erro ao parsear JSON de acessos:", e);
                    alert("Erro ao carregar detalhes de acessos. Verifique o console.");
                }
            }
        });
    }

    // Listener para fechar sidebar ao clicar fora (já existia)
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

    // Delegando eventos para os ListBoxes de filtro
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.addEventListener('change', (event) => {
            if (event.target.id === 'central-select-filter' || event.target.id === 'central-select-filter-clientes') {
                handleCentralFilterChange(event);
            } else if (event.target.id === 'equipamento-select-filter-clientes') {
                handleEquipamentoFilterChange(event);
            }
        });
    }

    // ---------------------------------------- EVENTOS DO MENU LATERAL ----------------------------------------
    document.querySelector('.sidebar li.centrais')?.addEventListener('click', () => {
        navigateTo('centrais');
    });

    document.querySelector('.sidebar li.equipamento')?.addEventListener('click', () => {
        navigateTo('equipamentos');
    });

    document.querySelector('.sidebar li.clientes')?.addEventListener('click', () => {
        navigateTo('clientes');
    });

    document.querySelector('.sidebar li.configuracoes')?.addEventListener('click', () => {
        navigateTo('configuracoes');
    });
});