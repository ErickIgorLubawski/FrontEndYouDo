// api/routes.js

export async function fetchCentrais() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  const resp = await fetch('https://mrdprototype.ddns.net/centrais', {
    method: 'GET',
    headers: {
      'token': token,
      'Content-Type': 'application/json'
    }
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ message: resp.statusText }));
    throw new Error(`Erro ${resp.status}: ${errorData.message || resp.statusText}`);
  }
  return resp.json();
}

/**
 * @description Busca equipamentos, opcionalmente filtrados por central_id (query parameter).
 * @param {string} [device_id] - O ID da Central para filtrar os equipamentos.
 * @returns {Promise<Object>} Promessa que resolve para a resposta JSON da API.
 */
export async function fetchEquipamentos(device_id = null) {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('Token não encontrado no fetchEquipamentos.');
    throw new Error('Token não encontrado. Faça login primeiro.');
  }
  //console.log('centralid DEBUG MEU',device_id)

  // CORREÇÃO 1: O endpoint correto é 'equipamentosdb'
  let url = 'https://mrdprototype.ddns.net/equipamentosdb';

  if (device_id) {
    // CORREÇÃO 2: O nome do parâmetro correto é 'central_id'
    url += `?central_id=${device_id}`; 
    //url += `?central_id=12364782186`; 
  //  console.log('DEBUG: URL fetchEquipamentos com centralId:', url);
  }
  
  // Este console.log agora mostrará a URL corrigida, que você pode comparar com a do Postman.
  console.log('DEBUG: URL fetchEquipamentos CORRIGIDA:', url);

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ message: resp.statusText }));
    throw new Error(`Erro ${resp.status} ao buscar equipamentos: ${errorData.message || resp.statusText}`);
  }
  return resp.json();
}


/**
 * @description Busca clientes (usuários), filtrados por equipamentoID (path parameter) em uma rota aninhada.
 * @param {string} equipamentoID - O ID do Equipamento (device_id) para filtrar os usuários.
 * @returns {Promise<Object>} Promessa que resolve para a resposta JSON da API.
 */
export async function fetchClientes(equipamentoID = null) { // Torne o parâmetro opcional novamente
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('Token não encontrado no fetchClientes.');
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  let url;
  if (equipamentoID) {
    // ATUALIZADO: Sua nova rota de filtro por equipamento
    url = `https://mrdprototype.ddns.net/usuarios/central?equipamento=${equipamentoID}`;
  } else {
    // Se nenhum equipamentoID for fornecido, chamamos a rota para LISTAR TODOS OS USUÁRIOS
    url = 'https://mrdprototype.ddns.net/usuarios'; // Assumindo que esta rota lista todos
  }
  
  console.log('DEBUG: URL fetchClientes (para usuários):', url);

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ message: resp.statusText }));
    throw new Error(`Erro ${resp.status} ao buscar clientes: ${errorData.message || resp.statusText}`);
  }
  return resp.json();
}
/**
 * @description Busca clientes (usuários), filtrados por central_id (query parameter).
 * @param {string} centralId - O device_id da Central para filtrar os usuários.
 * @returns {Promise<Object>} Promessa que resolve para a resposta JSON da API.
 */
export async function fetchClientesPorCentral(centralId) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  // Monta a URL para o endpoint que filtra usuários por central.
  const url = `https://mrdprototype.ddns.net/usuarioslocal?central=${centralId}`;
  
  console.log('DEBUG: Buscando clientes por central. URL:', url);

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ message: resp.statusText }));
    throw new Error(`Erro ${resp.status} ao buscar clientes por central: ${errorData.message || resp.statusText}`);
  }
  return resp.json();
}
/**
 * @description Busca um cliente (usuário) específico pelo seu idYD.
 * @param {string} idyd - O idYD do usuário a ser buscado.
 * @returns {Promise<Object>} Promessa que resolve para o objeto do usuário.
 */
export async function fetchClientePorIdYD(idyd) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  // Monta a URL para o endpoint que busca um usuário por idyd
  const url = `https://mrdprototype.ddns.net/usuarios?idyd=${idyd}`;
  
  console.log('DEBUG: Buscando cliente por idYD. URL:', url);

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!resp.ok) {
    // Se o usuário não for encontrado (404), não é um erro fatal.
    if (resp.status === 404) {
        return { resp: null }; // Retorna nulo para o frontend tratar
    }
    const errorData = await resp.json().catch(() => ({ message: resp.statusText }));
    throw new Error(`Erro ${resp.status} ao buscar cliente por idYD: ${errorData.message || resp.statusText}`);
  }
  return resp.json();
}
/**
 * @description Busca clientes (usuários) por nome.
 * @param {string} nome - O termo de busca para o nome do usuário.
 * @returns {Promise<Object>} Promessa que resolve para a resposta JSON da API.
 */
export async function fetchClientesPorNome(nome) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  // Monta a URL para o endpoint de busca por nome
  const url = `https://mrdprototype.ddns.net/usuariosname?name=${encodeURIComponent(nome)}`;
  
  console.log('DEBUG: Buscando clientes por nome. URL:', url);

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ message: resp.statusText }));
    throw new Error(`Erro ${resp.status} ao buscar clientes por nome: ${errorData.message || resp.statusText}`);
  }
  return resp.json();
}