import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-CAyWmuhx_Z4onMkUKwbi9zdXV4SnGZs",
  authDomain: "bookie-8cb30.firebaseapp.com",
  projectId: "bookie-8cb30",
  storageBucket: "bookie-8cb30.appspot.com",
  messagingSenderId: "128047446609",
  appId: "1:128047446609:web:114b80f8cbefec190c9670"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usersContainer = document.getElementById("users-container");

// Guarda o estado dos usuários editáveis
let usersData = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  // Aqui você pode colocar uma verificação para só permitir admin, se quiser

  await loadUsers();
});

async function loadUsers() {
  usersContainer.innerHTML = "<p>Carregando usuários...</p>";

  try {
    const snapshot = await getDocs(collection(db, "users"));
    usersData = [];

    if (snapshot.empty) {
      usersContainer.innerHTML = "<p>Nenhum usuário encontrado.</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      usersData.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderUsers();
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    usersContainer.innerHTML = "<p>Erro ao carregar usuários.</p>";
  }
}

function renderUsers() {
  usersContainer.innerHTML = "";

  usersData.forEach((user, index) => {
    const userRow = document.createElement("div");
    userRow.className = "user-row";

    userRow.innerHTML = `
      <div class="user-info">
        <input type="text" value="${user.name || user.displayName || ''}" disabled data-index="${index}" data-field="name" />
        <input type="email" value="${user.email || ''}" disabled data-index="${index}" data-field="email" />
      </div>
      <div class="buttons">
        <button class="edit-btn" data-index="${index}">Editar</button>
        <button class="save-btn oculto" data-index="${index}">Salvar</button>
        <button class="cancel-btn oculto" data-index="${index}">Cancelar</button>
        <button class="delete-btn" data-index="${index}">Excluir</button>
      </div>
    `;

    usersContainer.appendChild(userRow);
  });

  // Eventos dos botões
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", onEditClick);
  });

  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", onSaveClick);
  });

  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", onCancelClick);
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", onDeleteClick);
  });
}

function onEditClick(e) {
  const index = e.target.dataset.index;
  const userRow = e.target.closest(".user-row");
  const inputs = userRow.querySelectorAll("input");

  inputs.forEach(input => input.disabled = false);

  userRow.querySelector(".edit-btn").classList.add("oculto");
  userRow.querySelector(".save-btn").classList.remove("oculto");
  userRow.querySelector(".cancel-btn").classList.remove("oculto");
}

function onCancelClick(e) {
  const index = e.target.dataset.index;
  const userRow = e.target.closest(".user-row");
  const inputs = userRow.querySelectorAll("input");

  // Voltar valores originais
  inputs.forEach(input => {
    const field = input.dataset.field;
    input.value = usersData[index][field] || '';
    input.disabled = true;
  });

  userRow.querySelector(".edit-btn").classList.remove("oculto");
  userRow.querySelector(".save-btn").classList.add("oculto");
  userRow.querySelector(".cancel-btn").classList.add("oculto");
}

async function onSaveClick(e) {
  const index = e.target.dataset.index;
  const userRow = e.target.closest(".user-row");
  const inputs = userRow.querySelectorAll("input");

  // Pega os valores editados
  const updatedData = {};
  inputs.forEach(input => {
    updatedData[input.dataset.field] = input.value.trim();
  });

  if (!updatedData.name) {
    alert("Nome não pode ser vazio");
    return;
  }
  if (!updatedData.email || !validateEmail(updatedData.email)) {
    alert("Email inválido");
    return;
  }

  try {
    const userId = usersData[index].id;
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, updatedData);

    // Atualiza localmente para cancelar edição depois
    usersData[index] = { ...usersData[index], ...updatedData };

    alert("Usuário atualizado com sucesso!");

    // Fecha o modo edição
    inputs.forEach(input => input.disabled = true);
    userRow.querySelector(".edit-btn").classList.remove("oculto");
    userRow.querySelector(".save-btn").classList.add("oculto");
    userRow.querySelector(".cancel-btn").classList.add("oculto");
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    alert("Erro ao atualizar usuário.");
  }
}

async function onDeleteClick(e) {
  const index = e.target.dataset.index;
  const user = usersData[index];

  if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name || user.email}? Essa ação não pode ser desfeita.`)) {
    return;
  }

  try {
    await deleteDoc(doc(db, "users", user.id));
    usersData.splice(index, 1);
    renderUsers();
    alert("Usuário excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    alert("Erro ao excluir usuário.");
  }
}

function validateEmail(email) {
  // Simples regex de validação de email
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}
