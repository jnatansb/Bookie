import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import {
      getFirestore,
      collection,
      getDocs,
      addDoc,
      deleteDoc,
      updateDoc,
      doc,
      query,
      where
    } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    // Config Firebase
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

    const livrosContainer = document.getElementById("lista-livros");
    const form = document.getElementById("book-form");
    const createBtn = document.getElementById("create-book");
    const bookModal = document.getElementById("book-modal");
    const modalOverlay = document.getElementById("modal-overlay");

    function openModal() {
      bookModal.classList.remove("oculto");
      modalOverlay.classList.remove("oculto");
    }
    function closeModal() {
      form.reset();
      delete form.dataset.editingId;
      document.getElementById("modal-title").textContent = "Cadastrar Livro";
      bookModal.classList.add("oculto");
      modalOverlay.classList.add("oculto");
    }

    // Abrir/fechar modal
    createBtn.addEventListener("click", e => {
      e.preventDefault();
      openModal();
    });

    document.getElementById("close-modal").addEventListener("click", closeModal);
    document.getElementById("cancel-modal").addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", closeModal);

    // Submissão do form
    form.addEventListener("submit", async e => {
      e.preventDefault();
      
      const livro = {
        volumeInfo: {
          nome: form.titulo.value.trim(),
          autor: [form.autor.value.trim()],
          sinopse: form.descricao.value.trim(),
          imageLinks: { thumbnail: form.capa.value.trim() }
        },
        userId: auth.currentUser.uid,
        isFavorite: false
      };

      try {
        if (form.dataset.editingId) {
          // Editando livro existente
          await updateDoc(doc(db, "livros", form.dataset.editingId), livro);
          alert("Livro atualizado!");
          delete form.dataset.editingId;
        } else {
          await addDoc(collection(db, "livros"), livro);
          alert("Livro adicionado!");
        }
        closeModal();
        loadBooks();
      } catch (error) {
        console.error("Erro ao salvar livro:", error);
        alert("Erro ao salvar livro.");
      }
    });

    // Carregar livros
    async function loadBooks() {
      livrosContainer.innerHTML = "";
      const snapshot = await getDocs(collection(db, "livros"));
      snapshot.forEach(docSnap => {
        const data = docSnap.data().volumeInfo;
        const isFavorite = docSnap.data().isFavorite || false;
        const card = document.createElement("div");
        card.className = "livro-card";
        card.innerHTML = `
          <div class="book-content" onclick="viewBookDetails('${docSnap.id}')" style="cursor: pointer;">
            <img src="${data.imageLinks?.thumbnail ?? 'https://via.placeholder.com/150x220?text=Sem+Capa'}"/>
            <h3>${data.nome}</h3>
            <p><strong>${data.autor?.[0] ?? 'Autor desconhecido'}</strong></p>
            <p>${(data.sinopse || "").substring(0, 80)}…</p>
          </div>
          <div class="card-actions">
            <button class="btn-edit" onclick="editBook('${docSnap.id}')">✏️</button>
            <button class="btn-delete" onclick="deleteBook('${docSnap.id}')">🗑️</button>
            <button class="btn-favorite ${isFavorite ? 'favorited' : ''}" onclick="toggleFavorite('${docSnap.id}')">${isFavorite ? '❤️' : '🤍'}</button>
          </div>
        `;
        livrosContainer.appendChild(card);
      });
    }

    // Função para ver detalhes do livro
    window.viewBookDetails = function(bookId) {
      window.location.href = `book-details.html?bookId=${bookId}`;
    };

    // Função para deletar livro
    window.deleteBook = async function(bookId) {
      if (!confirm("Deseja excluir este livro?")) return;
      await deleteDoc(doc(db, "livros", bookId));
      loadBooks();
    };

    // Função para editar livro
    window.editBook = async function(bookId) {
      const snapshot = await getDocs(collection(db, "livros"));
      let bookData = null;
      snapshot.forEach(docSnap => {
        if (docSnap.id === bookId) {
          bookData = docSnap.data().volumeInfo;
        }
      });
      if (!bookData) return alert("Livro não encontrado.");
      form.titulo.value = bookData.nome || '';
      form.autor.value = bookData.autor?.[0] || '';
      form.descricao.value = bookData.sinopse || '';
      form.capa.value = bookData.imageLinks?.thumbnail || '';
        
        // Guardar o ID do livro sendo editado
      form.dataset.editingId = bookId;
      openModal();
    };

    // ✅ FAVORITAR
    window.toggleFavorite = async function (bookId) {
        try {
          const user = auth.currentUser;
          if (!user) return alert("Você precisa estar logado.");

          const bookDocRef = doc(db, "livros", bookId);
          const bookSnap = await getDocs(collection(db, "livros"));
          let bookData = null;

          bookSnap.forEach(docSnap => {
            if (docSnap.id === bookId) {
              bookData = docSnap.data();
            }
          });

          if (!bookData) return alert("Livro não encontrado.");

        // Alternar o estado de favorito
          const isFavorite = bookData.isFavorite || false;

          // Atualiza o campo no livro
          await updateDoc(bookDocRef, { isFavorite: !isFavorite });

          const favoritosRef = collection(db, "favoritos");

          if (!isFavorite) {
            await addDoc(favoritosRef, {
              volumeInfo: bookData.volumeInfo,
              usuario: { id: user.uid, email: user.email },
              timestamp: new Date()
            });
          } else {
            const q = query(favoritosRef, where("usuario.id", "==", user.uid));
            const favSnap = await getDocs(q);
            favSnap.forEach(async (favDoc) => {
              if (favDoc.data().volumeInfo?.nome === bookData.volumeInfo?.nome) {
                await deleteDoc(doc(db, "favoritos", favDoc.id));
              }
            });
          }

          loadBooks();
        } catch (e) {
          console.error("Erro ao atualizar favorito:", e);
          alert("Erro ao atualizar favorito.");
        }
      };

    // Autenticação / logout
    onAuthStateChanged(auth, user => {
      if (!user) return window.location.href = "login.html";
      loadBooks();
    });

    document.getElementById("logout-button")
      .addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "login.html";
      });

    // Menu
    document.addEventListener("DOMContentLoaded", () => {
      const toggle = document.getElementById("menu-toggle");
      const sidebar = document.getElementById("sidebar");
      const overlay = document.getElementById("overlay");
      const closeBtn = document.getElementById("close-sidebar");

      toggle.addEventListener("click", () => {
        sidebar.classList.add("active");
        overlay.classList.add("active");
      });

      overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
      });

      closeBtn.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
      });
    });