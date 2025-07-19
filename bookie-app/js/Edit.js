import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
    const modal = document.getElementById("modal-edicao");
    const form = document.getElementById("form-edicao");
    const closeBtn = document.getElementById("fechar-modal");
    const excluirBtn = document.getElementById("excluir-livro");

    const inputTitulo = document.getElementById("edit-titulo");
    const inputAutor = document.getElementById("edit-autor");
    const inputDescricao = document.getElementById("edit-descricao");
    const inputCapa = document.getElementById("edit-capa");

    let livroIdAtual = null;

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        livrosContainer.innerHTML = "<p>Faça login para ver seus livros.</p>";
        return;
      }

      const q = collection(db, "livros");
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        livrosContainer.innerHTML = "<p>Nenhum livro encontrado.</p>";
        return;
      }

      snapshot.forEach((docSnap) => {
        const livro = docSnap.data();
        const volume = livro.volumeInfo || {};
        const titulo = volume.nome || volume.title || "Sem Título";
        const autor = (volume.autor && volume.autor[0]) || (volume.authors && volume.authors[0]) || "Autor desconhecido";
        const descricao = volume.sinopse || volume.description || "";
        const capa = volume.imageLinks?.thumbnail || "https://via.placeholder.com/150x220?text=Sem+Capa";

        const card = document.createElement("div");
        card.className = "livro-card";
        card.innerHTML = `
          <img src="${capa}" alt="Capa do livro" />
          <h3>${titulo}</h3>
          <p><strong>${autor}</strong></p>
        `;
        card.addEventListener("click", () => {
          livroIdAtual = docSnap.id;
          inputTitulo.value = titulo;
          inputAutor.value = autor;
          inputDescricao.value = descricao;
          inputCapa.value = capa;
          modal.classList.remove("hidden");
        });

        livrosContainer.appendChild(card);
      });
    });

    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!livroIdAtual) return;
      const ref = doc(db, "livros", livroIdAtual);
      await updateDoc(ref, {
        volumeInfo: {
          title: inputTitulo.value,
          authors: [inputAutor.value],
          description: inputDescricao.value,
          imageLinks: { thumbnail: inputCapa.value }
        }
      });
      alert("Alterações salvas!");
      modal.classList.add("hidden");
      location.reload();
    });

    excluirBtn.addEventListener("click", async () => {
      if (!confirm("Deseja realmente excluir este livro?")) return;
      if (!livroIdAtual) return;
      await deleteDoc(doc(db, "livros", livroIdAtual));
      alert("Livro excluído com sucesso!");
      modal.classList.add("hidden");
      location.reload();
    });

    document.getElementById("logout-button").addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });
    document.getElementById("menu-toggle").addEventListener("click", () => {
      document.getElementById("sidebar").classList.add("active");
      document.getElementById("overlay").classList.remove("hidden");
    });
    document.getElementById("close-sidebar").addEventListener("click", () => {
      document.getElementById("sidebar").classList.remove("active");
      document.getElementById("overlay").classList.add("hidden");
    });
    document.getElementById("overlay").addEventListener("click", () => {
      document.getElementById("sidebar").classList.remove("active");
      document.getElementById("overlay").classList.add("hidden");
    });