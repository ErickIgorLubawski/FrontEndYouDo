document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = form.username.value.trim();
      const password = form.password.value.trim();

     // Para testes visuais rápidos da animação sem o backend:
      // console.log("Usuário:", username, "Senha:", password);
      // const loginCard = document.querySelector('.login-card');
      // loginCard.classList.add('logging-in');
      // setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
      // return; // Use 'return' para não continuar para o fetch durante o teste.

      try {
        const response = await fetch('http://localhost:3001/usuarios/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ usuario: username, senha: password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
          // SUCESSO NO LOGIN!

          // Salva o token imediatamente, isso não precisa esperar.
          localStorage.setItem('token', data.token);

          //  INÍCIO DA LÓGICA DE TRANSIÇÃO 

          // 1. Pega o elemento do card de login que queremos animar.
          const loginCard = document.querySelector('.login-card');

          // 2. Adiciona a classe '.logging-in' que ativa a animação no CSS.
          loginCard.classList.add('logging-in');

          // 3. Cria uma pausa de 500ms (0.5s) para dar tempo da animação acontecer.
          //    Depois desse tempo, o código dentro do setTimeout é executado.
          setTimeout(() => {
            // 4. Redireciona para o dashboard APENAS DEPOIS da animação.
            window.location.href = 'dashboard.html';
          }, 500); // O tempo (em ms) deve ser o mesmo da duração da sua animação no CSS.

          // ▲▲▲ FIM DA LÓGICA DE TRANSIÇÃO ▲▲▲

        } else {
          // Exibe um alerta se o login falhar.
          alert(data.message || 'Usuário ou senha inválidos');
        }
      } catch (error) {
        console.error("Falha na comunicação com a API:", error);
        alert("Não foi possível conectar ao servidor. Verifique o console.");
      }
    });
  }
});