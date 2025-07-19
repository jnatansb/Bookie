import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-CAyWmuhx_Z4onMkUKwbi9zdXV4SnGZs",
  authDomain: "bookie-8cb30.firebaseapp.com",
  projectId: "bookie-8cb30",
  storageBucket: "bookie-8cb30.appspot.com",
  messagingSenderId: "128047446609",
  appId: "1:128047446609:web:114b80f8cbefec190c9670"
};

// Inicialize o Firebase apenas uma vez
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Verifique a autenticação antes de qualquer ação
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("Usuário não autenticado, redirecionando...");
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  console.log("Usuário autenticado:", user.email);
});

// Função para navegar para a página de seleção
async function proceedToAddBooks() {
  console.log("Botão próximo clicado");
  
  if (!currentUser) {
    console.error("Usuário não está autenticado");
    alert("Sua sessão expirou. Por favor, faça login novamente.");
    window.location.href = "login.html";
    return;
  }

  const listName = document.getElementById('list-name').value.trim();
  const description = document.getElementById('list-description').value.trim();
  
  if (!listName) {
    alert("Por favor, dê um nome à sua lista");
    return;
  }
  
  try {
    console.log("Salvando dados temporários...");
    localStorage.setItem('tempListData', JSON.stringify({
      name: listName,
      description: description,
      userId: currentUser.uid
    }));
    
    console.log("Redirecionando para SelectBooks.html...");
    window.location.href = "SelectBooks.html";
    
  } catch (error) {
    console.error("Erro ao prosseguir:", error);
    alert("Ocorreu um erro. Por favor, tente novamente.");
  }
}

// Configuração dos eventos
document.addEventListener('DOMContentLoaded', () => {
  console.log("Página CreateList carregada");
  
  document.getElementById('next-btn').addEventListener('click', proceedToAddBooks);
  
  document.getElementById('cancel-btn').addEventListener('click', () => {
    window.history.back();
  });
});