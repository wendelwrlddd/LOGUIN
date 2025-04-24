document.querySelectorAll("form").forEach((form, index) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const email = form.querySelector('input[type="email"]')?.value || "teste@teste.com";
      const password = form.querySelector('input[type="password"]').value;
      const name = form.querySelector('input[type="text"]')?.value;
  
      const isLogin = index === 0;
      const endpoint = isLogin ? "/login" : "/register";
      const body = isLogin ? { email, password } : { name, email, password };
  
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
  
      const data = await res.json();
  
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.name);
        window.location.href = "/painel.html";
      } else {
        alert(data.error || "Algo deu errado!");
      }
    });
  });
  