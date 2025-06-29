import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const db = getFirestore();

function parseVolumeInfo(volume) {
  const capa = volume.imageLinks?.thumbnail || "https://via.placeholder.com/150x220?text=Sem+Capa";
  const titulo = volume.nome || volume.title || "Sem Título";
  const autor = (volume.autor && volume.autor[0]) || (volume.authors && volume.authors[0]) || "Autor desconhecido";
  const descricao = volume.sinopse || volume.description || "";
  return { capa, titulo, autor, descricao };
}

function criarCardLivro({ capa, titulo, autor, descricao }) {
  const card = document.createElement("div");
  card.className = "livro-card";

  card.innerHTML = `
    <img src="${capa}" alt="Capa do livro ${titulo}">
    <h3>${titulo}</h3>
    <p><strong>${autor}</strong></p>
    <p>${descricao.substring(0, 80)}...</p>
  `;

  return card;
}

export function carregarLivros(auth, container, userFilter = true) {
  container.innerHTML = "";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      container.innerHTML = "<p>Faça login para ver seus livros.</p>";
      return;
    }

    let q;
    if (userFilter) {
      q = query(collection(db, "livros"), where("usuario.uid", "==", user.uid));
    } else {
      q = collection(db, "livros");
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = "<p>Nenhum livro encontrado.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const livro = doc.data();
      const volume = livro.volumeInfo || {};
      const dados = parseVolumeInfo(volume);

      const card = criarCardLivro(dados);
      container.appendChild(card);
    });
  });
}