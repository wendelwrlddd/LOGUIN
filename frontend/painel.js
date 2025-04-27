const token = localStorage.getItem("token");
const name = localStorage.getItem("username");
document.getElementById("boas-vindas").innerText = `Olá, ${name}!`;

async function fetchDiary() {
  const res = await fetch("/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.diary) return;

  const list = document.getElementById("diary-list");
  const notes = document.getElementById("annotations");
  list.innerHTML = "";
  notes.querySelectorAll(".note").forEach(n => n.remove());

  data.diary.forEach(entry => {
    // List item
    const li = document.createElement("li");

    // Estrela
    const star = document.createElement("span");
    star.className = "star";
    star.innerHTML = "☆";
    li.appendChild(star);

    // Texto
    const text = document.createElement("span");
    text.innerText = entry.content;
    li.appendChild(text);

    // Timestamp
    const ts = document.createElement("span");
    ts.className = "timestamp";
    const dt = new Date(entry.created_at);
    ts.innerText = dt.toLocaleString(); 
    li.appendChild(ts);

    // Click na estrela
    star.addEventListener("click", () => {
      star.classList.toggle("selected");
      if (star.classList.contains("selected")) {
        star.innerHTML = "★";
        addAnnotation(entry);
      } else {
        star.innerHTML = "☆";
        removeAnnotation(entry);
      }
    });

    list.appendChild(li);
  });
}

function addAnnotation(entry) {
  const notes = document.getElementById("annotations");
  const note = document.createElement("div");
  note.className = "note";
  note.dataset.id = entry.id;
  note.innerText = `${new Date(entry.created_at).toLocaleString()} — ${entry.content}`;
  notes.appendChild(note);
}

function removeAnnotation(entry) {
  const notes = document.getElementById("annotations");
  const note = notes.querySelector(`.note[data-id='${entry.id}']`);
  if (note) note.remove();
}

document.getElementById("diary-form").addEventListener("submit", async e => {
  e.preventDefault();
  const content = document.getElementById("diary-entry").value;
  await fetch("/add-diary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  document.getElementById("diary-entry").value = "";
  fetchDiary();
});

function logout() {
  localStorage.clear();
  window.location.href = "/";
}

// Carrega ao iniciar
fetchDiary();
