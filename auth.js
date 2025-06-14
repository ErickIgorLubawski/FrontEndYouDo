document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
if(form){

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = form.username.value.trim();
    const password = form.password.value.trim();
 
    console.log(username)
    console.log(password)

    const response = await fetch('http://localhost:3001/usuarios/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usuario: username, senha: password })
    });

    const data = await response.json();
    
    // console.log(data)
    // console.log(data)
    if (response.ok && data.token) {
      // Armazena o token como cookie por 1 dia (com secure e path)
      // setCookie('token', data.token, 1);
      // Atualiza a variável global token
      // Redireciona para a área protegida
      // const token = data.token;
      localStorage.setItem('token', data.token); // salva no login
     window.location.href = 'dashboard.html';
    } else {
      alert('Usuário ou senha inválidos');
    }
  });
}
});
