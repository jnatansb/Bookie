import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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

let selectedBooks = [];
let allBooks = [];
let currentUser = null;

// Verificação de autenticação
onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("Usuário não autenticado em SelectBooks");
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
});

document.addEventListener('DOMContentLoaded', async () => {
  
  if (!currentUser) {
    return;
  }

  const tempListData = JSON.parse(localStorage.getItem('tempListData'));
  
  if (!tempListData || tempListData.userId !== currentUser.uid) {
    console.error("Dados inválidos ou usuário não corresponde");
    alert("Dados da lista inválidos. Por favor, comece novamente.");
    window.location.href = "CreateList.html";
    return;
  }
  
  document.getElementById('list-title').textContent = `Selecionar Livros: ${tempListData.name}`;
  
  await loadBooks();
  setupEventListeners();
});