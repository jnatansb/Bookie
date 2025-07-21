import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  const tempListData = JSON.parse(localStorage.getItem('tempListData'));

  if (!tempListData || tempListData.userId !== currentUser.uid) {
    alert("Dados da lista inválidos. Por favor, comece novamente.");
    window.location.href = "CreateList.html";
    return;
  }

  document.getElementById('list-title').textContent = `Selecionar Livros: ${tempListData.name}`;

  await loadBooks();
  setupEventListeners();
});

async function loadBooks() {
  const livrosRef = collection(db, "livros");
  const snapshot = await getDocs(livrosRef);

  allBooks = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  renderBooks(allBooks);
}

function renderBooks(books) {
  const grid = document.getElementById('books-grid');
  grid.innerHTML = '';

  if (books.length === 0) {
    grid.innerHTML = `<div class="empty-state">Nenhum livro encontrado.</div>`;
    return;
  }

  books.forEach(book => {
    const isSelected = selectedBooks.includes(book.id);

    const volume = book.volumeInfo || {};
    const title = volume.nome || volume.title || "Sem título";
    const author = volume.autor?.[0] || volume.authors?.[0] || "Desconhecido";
    const image = volume.imageLinks?.thumbnail || "https://via.placeholder.com/150x200?text=Sem+Capa";


    const card = document.createElement('div');
    card.className = `book-card ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="select-checkbox"></div>
      <img src="${image}" alt="${title}">
      <h3>${title}</h3>
      <p>${author}</p>
    `;

    card.addEventListener('click', () => {
      toggleSelection(book.id);
    });

    grid.appendChild(card);
  });

  updateSelectionCount();
}

function toggleSelection(bookId) {
  if (selectedBooks.includes(bookId)) {
    selectedBooks = selectedBooks.filter(id => id !== bookId);
  } else {
    selectedBooks.push(bookId);
  }
  renderBooks(allBooks);
}

function updateSelectionCount() {
  const count = selectedBooks.length;
  document.getElementById("selected-count").textContent = count;
  document.getElementById("selected-badge").textContent = count;
  document.getElementById("confirm-selection").disabled = count === 0;
}

async function saveListWithBooks() {
  const tempListData = JSON.parse(localStorage.getItem("tempListData"));

  if (!tempListData || selectedBooks.length === 0) {
    alert("Por favor, selecione pelo menos um livro.");
    return;
  }

  try {
    await addDoc(collection(db, "listas"), {
      ...tempListData,
      livros: selectedBooks,
      createdAt: new Date()
    });

    localStorage.removeItem("tempListData");
    alert("Lista criada com sucesso!");
    window.location.href = "Home.html";
  } catch (err) {
    console.error("Erro ao salvar lista:", err);
    alert("Erro ao criar lista.");
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById('book-search');

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();

    const filteredBooks = allBooks.filter(book => {
      const title = book.titulo || book.nome || book.volumeInfo?.title || "";
      const author = book.autor || book.volumeInfo?.authors?.[0] || "";
      return title.toLowerCase().includes(searchTerm) || author.toLowerCase().includes(searchTerm);
    });

    renderBooks(filteredBooks);
  });

  document.getElementById('confirm-selection').addEventListener('click', saveListWithBooks);
}
