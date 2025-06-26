// script.js

// Autenticação inicial
(function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Acesso negado. Por favor, faça o login para continuar.');
        window.location.href = 'login.html';
    }
})();

// Importa as funções de API
import './auth.js';
import { fetchCentrais, fetchEquipamentos as fetchEquipamentosAPI, fetchClientes as fetchClientesAPI, fetchClientesPorCentral, fetchClientePorIdYD } from './api/routes.js';

// Referências aos elementos DOM
const modalOverlay = document.getElementById('acessos-modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const acessosListContainer = document.getElementById('acessos-list-container');
const modalTitle = document.getElementById('modal-title');
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;
const darkModeLabel = document.querySelector('.dark-mode-label');
const toggleSidebarBtn = document.querySelector('.toggle-btn');
const sidebar = document.getElementById('sidebar');

// Cache de dados e estado de navegação
let allCentraisData = [];
let currentPath = [];

// --- Funções de Utilitário ---

function applyTheme(isDarkMode) {
    if (isDarkMode) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
    if (darkModeToggle) darkModeToggle.checked = isDarkMode;
}

function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    setTimeout(() => {
        if (darkModeLabel) darkModeLabel.style.opacity = sidebar.classList.contains('collapsed') ? '0' : '1';
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

function openAcessosModal(clienteNome, acessos, equipamentosContexto) {
    modalTitle.textContent = `Detalhes de Acessos de ${clienteNome}`;
    acessosListContainer.innerHTML = '';

    if (acessos && acessos.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'acessos-detail-list';

        // =======================================================================
        // CORREÇÃO: Função de formatação de data mais robusta.
        // =======================================================================
        const parseAndFormatDate = (dateString) => {
            if (!dateString || typeof dateString !== 'string') return 'Data não informada';

            // Regex para capturar as partes da data no formato DD-MM-YYYY HH:MM:SS
            const parts = dateString.match(/^(\d{2})-(\d{2})-(\d{4})\s(\d{2}):(\d{2}):(\d{2})$/);

            if (!parts) {
                // Se não corresponder, tenta o formato padrão (como ISO)
                const dateObj = new Date(dateString);
                return isNaN(dateObj.getTime()) ? 'Formato Inválido' : dateObj.toLocaleString('pt-BR');
            }

            // parts[0] é a string completa, [1] é o dia, [2] o mês, etc.
            const day = parseInt(parts[1], 10);
            const month = parseInt(parts[2], 10);
            const year = parseInt(parts[3], 10);
            const hour = parseInt(parts[4], 10);
            const minute = parseInt(parts[5], 10);
            const second = parseInt(parts[6], 10);

            // IMPORTANTE: O mês no construtor Date() é 0-indexado (Janeiro = 0, Fevereiro = 1, etc.)
            // Por isso subtraímos 1 do mês que lemos.
            const dateObj = new Date(year, month - 1, day, hour, minute, second);

            if (isNaN(dateObj.getTime())) {
                return 'Data Inválida';
            }
            
            return dateObj.toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        };

        acessos.forEach((acesso, index) => {
            const li = document.createElement('li');
            li.className = 'acesso-item-card';

            const centralNome = allCentraisData.find(c => c.device_id === acesso.central)?.nomeEdificio || acesso.central;
            const equipamentoNome = equipamentosContexto.find(e => e.device_id === acesso.equipamento)?.device_hostname || acesso.equipamento;
            
            const begin = parseAndFormatDate(acesso.begin_time);
            const end = parseAndFormatDate(acesso.end_time);

            li.innerHTML = `
                <div class="acesso-item-header"><h4>Acesso ${index + 1}</h4></div>
                <div class="acesso-item-body">
                    <div class="detail-pair"><span class="detail-label">🏢 Central:</span><span class="detail-value">${centralNome}</span></div>
                    <div class="detail-pair"><span class="detail-label">🔧 Equipamento:</span><span class="detail-value">${equipamentoNome}</span></div>
                    <div class="detail-pair"><span class="detail-label">👤 ID no Equip.:</span><span class="detail-value">${acesso.user_idEquipamento || 'N/A'}</span></div>
                    <div class="detail-pair period-pair"><span class="detail-label">⏰ Período:</span><span class="detail-value period-value"><span>Início: ${begin}</span><span>Fim: ${end}</span></span></div>
                </div>`;
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
    if (!targetSelectElement) return;
    targetSelectElement.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todas as Centrais';
    targetSelectElement.appendChild(defaultOption);
    centrais.forEach(central => {
        const option = document.createElement('option');
        option.value = central.device_id;
        option.textContent = central.nomeEdificio;
        targetSelectElement.appendChild(option);
    });
    targetSelectElement.value = selectedCentralId || '';
}

async function populateEquipamentoFilter(equipamentosList, selectedEquipamentoId, targetSelectElement) {
    if (!targetSelectElement) return;
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

// --- Handlers de Filtro ---

function handleCentralFilterChange(event) {
    const selectedCentralId = event.target.value;
    const selectedCentralName = event.target.options[event.target.selectedIndex].text;
    const currentSectionContainer = event.target.closest('.content-section');
    if (currentSectionContainer.id === 'equipamentos') {
        navigateTo('equipamentos', { centralId: selectedCentralId, centralName: selectedCentralName });
    } else if (currentSectionContainer.id === 'clientes') {
        navigateTo('clientes', { centralId: selectedCentralId, centralName: selectedCentralName, equipamentoId: '' });
    }
}

function handleEquipamentoFilterChange(event) {
    const selectedEquipamentoId = event.target.value;
    const selectedEquipamentoName = event.target.options[event.target.selectedIndex].text;
    const centralSelect = document.getElementById('central-select-filter-clientes');
    const selectedCentralId = centralSelect.value;
    const selectedCentralName = centralSelect.options[centralSelect.selectedIndex].text;
    navigateTo('clientes', {
        centralId: selectedCentralId,
        centralName: selectedCentralName,
        equipamentoId: selectedEquipamentoId,
        equipamentoName: selectedEquipamentoName
    });
}

// --- Funções de Navegação e Renderização ---

function navigateTo(section, params = {}, addToHistory = true) {
    console.log(`DEBUG: navigateTo - Seção: ${section}, Params:`, params);
    const newPathItem = { section, ...params };
    if (addToHistory) {
        history.pushState(newPathItem, '', `?${new URLSearchParams(newPathItem).toString()}`);
    }
    currentPath.push(newPathItem);
    showSection(section);
    const { centralId, centralName, equipamentoId, equipamentoName, idyd } = params;
    if (section === 'centrais') {
        renderCentrais();
    } else if (section === 'equipamentos') {
        renderEquipamentos(centralId, centralName);
    } else if (section === 'clientes') {
        renderUsuarios(equipamentoId, equipamentoName, centralId, centralName, idyd);
    }
}

window.addEventListener('popstate', (event) => {
    if (event.state) {
        const { section, ...params } = event.state;
        navigateTo(section, params, false);
    } else {
        navigateTo('centrais', {}, false);
    }
});

// --- Funções de Renderização de Seções ---

async function renderCentrais() {
    document.querySelector('#equipamentos .central-filter-container').style.display = 'none';
    document.querySelector('#clientes .filter-container').style.display = 'none';
    const centralList = document.getElementById('centrais-list');
    if (!centralList) return;
    document.getElementById('centrais-section-title').textContent = 'Centrais';
    centralList.innerHTML = '<p>Carregando centrais...</p>';
    try {
        if (allCentraisData.length === 0) {
            const { resp = [] } = await fetchCentrais();
            allCentraisData = resp;
        }
        centralList.innerHTML = '';
        if (allCentraisData.length === 0) {
            centralList.innerHTML = '<p>Nenhuma central encontrada.</p>';
            return;
        }
        allCentraisData.forEach(c => {
            const card = document.createElement('div');
            card.className = '_card_14g8r_30';
            card.onclick = () => navigateTo('equipamentos', { centralId: c.device_id, centralName: c.nomeEdificio });
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
            const centralIdElement = document.createElement('p');
            centralIdElement.className = 'central-id';
            centralIdElement.textContent = `Device ID: ${c.device_id}`;
            content.append(icon, location, centralIdElement);
            card.append(header, content);
            centralList.append(card);
        });
    } catch (err) { console.error('ERROR: Falha ao carregar centrais:', err); }
}

async function renderEquipamentos(centralId = null, centralName = null) {
    document.querySelector('#clientes .filter-container').style.display = 'none';
    const equipList = document.getElementById('equipamentos-list');
    const centralFilterContainer = document.querySelector('#equipamentos .central-filter-container');
    const centralSelectFilter = document.getElementById('central-select-filter');
    const equipamentosSectionTitle = document.getElementById('equipamentos-section-title');
    if (!equipList || !centralSelectFilter || !equipamentosSectionTitle) return;
    centralFilterContainer.style.display = 'flex';
    equipList.innerHTML = '<p>Carregando equipamentos...</p>';
    equipamentosSectionTitle.textContent = centralName ? `Equipamentos da Central: ${centralName}` : 'Todos os Equipamentos';
    centralSelectFilter.onchange = handleCentralFilterChange;
    try {
        if (allCentraisData.length === 0) {
            const { resp = [] } = await fetchCentrais();
            allCentraisData = resp;
        }
        populateCentralFilter(allCentraisData, centralId, centralSelectFilter);
        const { resp: equipamentosFiltrados = [] } = await fetchEquipamentosAPI(centralId);
        equipList.innerHTML = '';
        if (equipamentosFiltrados.length === 0) {
            equipList.innerHTML = centralId ? '<p>Nenhum equipamento encontrado para esta central.</p>' : '<p>Selecione uma central para ver os equipamentos.</p>';
            return;
        }
        equipamentosFiltrados.forEach(e => {
            const card = document.createElement('div');
            card.className = '_card_14g8r_30 equipment-card';
            card.onclick = () => navigateTo('clientes', {
                centralId: e.central_id,
                centralName: allCentraisData.find(c => c.device_id === e.central_id)?.nomeEdificio || 'Central',
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
            const fields = [['IP', e.ip], ['MAC', e.mac], ['Criado em', new Date(e.createdAt).toLocaleString('pt-BR')], ['Atualizado em', new Date(e.updatedAt).toLocaleString('pt-BR')]];
            fields.forEach(([label, val]) => {
                const dt = document.createElement('dt'); dt.textContent = label;
                const dd = document.createElement('dd'); dd.textContent = val;
                body.append(dt, dd);
            });
            card.append(header, title, status, body);
            equipList.append(card);
        });
    } catch (err) { console.error('ERROR: Falha ao carregar equipamentos:', err); }
}

async function renderUsuarios(equipamentoId = null, equipamentoName = null, centralId = null, centralName = null, idyd = null) {
    console.log(`DEBUG: Renderizando usuários. idYD: ${idyd || 'N/A'}, Central: ${centralId || 'N/A'}, Equipamento: ${equipamentoId || 'Todos'}`);
    document.querySelector('#equipamentos .central-filter-container').style.display = 'none';
    const tbody = document.getElementById('clientes-tbody');
    const clientesSectionTitle = document.getElementById('clientes-section-title');
    const filterContainer = document.querySelector('#clientes .filter-container');
    const searchInput = document.getElementById('user-id-search-input');
    const searchBtn = document.getElementById('user-search-btn');
    const clearBtn = document.getElementById('user-clear-btn');
    
    let centralSelect = document.getElementById('central-select-filter-clientes');
    if (!centralSelect) {
        centralSelect = document.createElement('select');
        centralSelect.id = 'central-select-filter-clientes';
        centralSelect.className = 'filter-select';
        filterContainer.prepend(centralSelect);
    }
    let equipamentoSelect = document.getElementById('equipamento-select-filter-clientes');
    if (!equipamentoSelect) {
        equipamentoSelect = document.createElement('select');
        equipamentoSelect.id = 'equipamento-select-filter-clientes';
        equipamentoSelect.className = 'filter-select';
        centralSelect.after(equipamentoSelect);
    }
    
    filterContainer.style.display = 'flex';
    centralSelect.onchange = handleCentralFilterChange;
    equipamentoSelect.onchange = handleEquipamentoFilterChange;
    
    if (idyd) {
        searchInput.value = idyd;
        searchBtn.style.display = 'none';
        clearBtn.style.display = 'inline-block';
        centralSelect.disabled = true;
        equipamentoSelect.disabled = true;
    } else {
        searchInput.value = '';
        searchBtn.style.display = 'inline-block';
        clearBtn.style.display = 'none';
        centralSelect.disabled = false;
        equipamentoSelect.disabled = false;
    }
    
    clientesSectionTitle.textContent = idyd ? `Resultado da Busca por ID: ${idyd}` : (equipamentoName ? `Usuários do Equipamento: ${equipamentoName}` : (centralName ? `Usuários da Central: ${centralName}` : 'Todos os Usuários'));
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Carregando...</td></tr>';
    
    try {
        if (allCentraisData.length === 0) {
            const { resp = [] } = await fetchCentrais();
            allCentraisData = resp;
        }
        populateCentralFilter(allCentraisData, centralId, centralSelect);
        const { resp: equipamentosParaFiltro = [] } = await fetchEquipamentosAPI(centralId);
        await populateEquipamentoFilter(equipamentosParaFiltro, equipamentoId, equipamentoSelect);

        let clientes = [];
        if (idyd) {
            const { resp: usuarioEncontrado } = await fetchClientePorIdYD(idyd);
            clientes = usuarioEncontrado ? [usuarioEncontrado] : [];
        } else if (equipamentoId) {
            const { resp: fetchedUsers = [] } = await fetchClientesAPI(equipamentoId);
            clientes = fetchedUsers;
        } else if (centralId) {
            const { resp: fetchedUsers = [] } = await fetchClientesPorCentral(centralId);
            clientes = fetchedUsers;
        } else {
            const { resp: allUsers = [] } = await fetchClientesAPI();
            clientes = allUsers;
        }

        tbody.innerHTML = '';
        if (clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum usuário encontrado para este filtro.</td></tr>';
            return;
        }

        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            const totalAcessos = cliente.acessos?.length || 0;
            const createdAt = cliente.createdAt ? new Date(cliente.createdAt).toLocaleString('pt-BR') : '-';
            const updatedAt = cliente.updatedAt ? new Date(cliente.updatedAt).toLocaleString('pt-BR') : '-';
            let acessosHtml = 'Nenhum';
            if (totalAcessos > 0) {
                const acessosString = JSON.stringify(cliente.acessos);
                const clienteNomeString = encodeURIComponent(cliente.name || 'Cliente');
                acessosHtml = `<button class="view-acessos-btn" data-acessos='${acessosString}' data-cliente-nome="${clienteNomeString}">${totalAcessos} Acesso(s)</button>`;
            }
            tr.innerHTML = `
                <td>${cliente.idYD || '-'}</td>
                <td>${cliente.name || '-'}</td>
                <td>${acessosHtml}</td>
                <td>${createdAt}</td>
                <td>${updatedAt}</td>`;
            tbody.appendChild(tr);
        });

        tbody.onclick = function(event) {
            const button = event.target.closest('.view-acessos-btn');
            if (button) {
                const clienteNome = decodeURIComponent(button.dataset.clienteNome);
                const acessos = JSON.parse(button.dataset.acessos);
                openAcessosModal(clienteNome, acessos, equipamentosParaFiltro);
            }
        };

    } catch (err) {
        console.error('ERROR: Falha ao carregar dados para a página de usuários:', err);
    }
}

// --- Lógica de Inicialização ---
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(localStorage.getItem('theme') === 'dark');
    try {
        const { resp: centraisResp = [] } = await fetchCentrais();
        allCentraisData = centraisResp;
    } catch (error) {
        console.error('Erro ao pré-carregar centrais:', error);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const initialSection = urlParams.get('section') || 'centrais';
    const initialParams = Object.fromEntries(urlParams.entries());
    navigateTo(initialSection, initialParams, false);

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', (event) => { if (event.target === event.currentTarget) closeModal(); });
    if (darkModeToggle) darkModeToggle.addEventListener('change', () => applyTheme(darkModeToggle.checked));

    const searchInput = document.getElementById('user-id-search-input');
    const searchBtn = document.getElementById('user-search-btn');
    const clearBtn = document.getElementById('user-clear-btn');
    const performUserSearch = () => {
        const idydValue = searchInput.value.trim();
        if (idydValue) navigateTo('clientes', { idyd: idydValue });
    };
    if (searchBtn) searchBtn.addEventListener('click', performUserSearch);
    if (searchInput) searchInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') performUserSearch(); });
    if (clearBtn) clearBtn.addEventListener('click', () => navigateTo('clientes', {}));

    if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
    document.addEventListener('click', e => {
        if (sidebar && !sidebar.classList.contains('collapsed') && !sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target)) {
            toggleSidebar();
        }
    });

    document.querySelector('.sidebar li.centrais')?.addEventListener('click', () => navigateTo('centrais'));
    document.querySelector('.sidebar li.equipamento')?.addEventListener('click', () => navigateTo('equipamentos'));
    document.querySelector('.sidebar li.clientes')?.addEventListener('click', () => navigateTo('clientes'));
    document.querySelector('.sidebar li.configuracoes')?.addEventListener('click', () => navigateTo('configuracoes'));
});