


export async function fetchCentrais() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  const resp = await fetch('http://mrdprototype.ddns.net:3001/central', {
    method: 'GET',
    headers: {
      'token': token,
      'Content-Type': 'application/json'
    }
  });
  if (!resp.ok) {
    throw new Error(`Erro ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}
export async function fetchEquipamentos() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('aqui passou')
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  const resp = await fetch('http://mrdprototype.ddns.net:3001/equipamentos', {
    method: 'GET',
    headers: {
      'token': token,
      'Content-Type': 'application/json'
    }
  });
  // const json = await resp.json();  // <-- Aguarde o JSON aqui
  // console.log('Resposta convertida para JSON:', json);

  if (!resp.ok) {
    throw new Error(`Erro ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}
export async function fetchClientes() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('aqui passou')
    throw new Error('Token não encontrado. Faça login primeiro.');
  }

  const resp = await fetch('http://mrdprototype.ddns.net:3001/usuarios', {
    method: 'GET',
    headers: {
      'token': token,
      'Content-Type': 'application/json'
    }
  });
  // console.log('DEBUG: fetchClientes chamado')
  // const json = await resp.json();  // <-- Aguarde o JSON aqui
  // console.log('Resposta convertida para JSON:', json);

  if (!resp.ok) {
    throw new Error(`Erro ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}