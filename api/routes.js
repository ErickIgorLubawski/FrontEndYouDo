// api/routes.js

export async function fetchCentrais() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  const resp = await fetch('http://mrdprototype.ddns.net:557/centrais', {
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
 * @description Busca equipamentos, opcionalmente filtrados por centralId (query parameter).
 * @param {string} [centralId] - O ID da Central para filtrar os equipamentos.
 * @returns {Promise<Object>} Promessa que resolve para a resposta JSON da API.
 */
export async function fetchEquipamentos(centralId = null) {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('Token não encontrado no fetchEquipamentos.');
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  let url = 'http://mrdprototype.ddns.net:557/equipamentos'; // Endpoint do backend para equipamentos

  if (centralId) {
    url += `?centralId=${centralId}`; // Filtro como query parameter
  }
  
  console.log('DEBUG: URL fetchEquipamentos:', url);

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
    url = `http://mrdprototype.ddns.net:557/usuarios/central?equipamento=${equipamentoID}`;
  } else {
    // Se nenhum equipamentoID for fornecido, chamamos a rota para LISTAR TODOS OS USUÁRIOS
    url = 'http://mrdprototype.ddns.net:557/usuarios'; // Assumindo que esta rota lista todos
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