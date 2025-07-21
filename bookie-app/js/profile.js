import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profileBio = document.getElementById("profile-bio");
const profileImage = document.getElementById("profile-image");
const profileCreated = document.getElementById("profile-created");
const profileFollowers = document.getElementById("profile-followers");
const profileFollowing = document.getElementById("profile-following");
const profilePosts = document.getElementById("profile-posts");
const userBooksContainer = document.getElementById("user-books");

function formatDate(dateString) {
  if (!dateString) return "Desconhecido";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
}

window.editProfile = () => alert("Editar Perfil - implementar");
window.deleteAccount = () => alert("Deletar Conta - implementar");
window.logout = async () => {
  await signOut(auth);
  window.location.href = "login.html";
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  await loadUserLists(user.uid);


  async function loadUserLists(uid) {
  try {
    const listsContainer = document.getElementById("user-lists");
    listsContainer.innerHTML = "";
    
    const q = query(collection(db, "listas"), where("userId", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      listsContainer.innerHTML = `
        <div class="empty-state">
          <p>Você ainda não criou nenhuma lista.</p>
          <button onclick="window.location.href='CreateList.html'" class="btn-create-list">
            Criar Primeira Lista
          </button>
        </div>
      `;
      return;
    }

    snapshot.forEach((doc) => {
      const list = doc.data();
      const listElement = document.createElement("div");
      listElement.className = "list-card";
      listElement.innerHTML = `
        <h4>${list.name}</h4>
        ${list.description ? `<p>${list.description}</p>` : ''}
        <div class="list-meta">
          <span>📚 ${list.livros.length} livros</span>
          <button onclick="viewList('${doc.id}', this)">Ver Lista</button>
        </div>
        <div class="list-books" style="display:none; margin-top: 10px;"></div>
      `;
      listsContainer.appendChild(listElement);
    });

  } catch (error) {
    console.error("Erro ao carregar listas:", error);
    document.getElementById("user-lists").innerHTML = `
      <div class="error-state">
        <p>Erro ao carregar suas listas.</p>
      </div>
    `;
  }
}

window.viewList = async function(listId, buttonElement) {
  try {
    const listCard = buttonElement.closest('.list-card');
    const booksContainer = listCard.querySelector('.list-books');

    if (booksContainer.style.display === 'block') {
      booksContainer.style.display = 'none';
      buttonElement.textContent = 'Ver Lista';
      return;
    }

    booksContainer.style.display = 'block';
    buttonElement.textContent = 'Esconder Lista';
    booksContainer.innerHTML = '<p>Carregando livros...</p>';

    const docRef = doc(db, "listas", listId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      booksContainer.innerHTML = '<p>Lista não encontrada.</p>';
      return;
    }

    const listData = docSnap.data();
    const livros = listData.livros || [];

    if (livros.length === 0) {
      booksContainer.innerHTML = '<p>Esta lista não possui livros.</p>';
      return;
    }

    booksContainer.innerHTML = '';

    for (const livroId of livros) {
    try {
      const livroRef = doc(db, "livros", livroId);
      const livroSnap = await getDoc(livroRef);

      if (!livroSnap.exists()) {
        console.warn(`Livro com ID ${livroId} não encontrado.`);
        continue;
      }

      const livro = livroSnap.data();
      const volume = livro.volumeInfo || {};
      const capa = volume.imageLinks?.thumbnail || "https://placehold.co/150x220?text=Sem+Capa";
      const titulo = volume.title || volume.nome || "Sem Título";
      const autor = volume.authors?.[0] || volume.autor || "Autor desconhecido";
      const sinopse = (volume.description || livro.sinopse || "").substring(0, 80) + "…";

      const card = document.createElement("div");
      card.className = "livro-card";
      card.style.marginBottom = "1rem";
      card.innerHTML = `
        <div class="book-content" style="cursor: default;">
          <img src="${capa}" alt="Capa do livro" />
          <h3>${titulo}</h3>
          <p><strong>${autor}</strong></p>
          <p>${sinopse}</p>
        </div>
      `;

      booksContainer.appendChild(card);
    } catch (err) {
      console.error("Erro ao buscar livro:", err);
    }
  }

  } catch (error) {
    console.error("Erro ao carregar livros da lista:", error);
    alert("Erro ao carregar livros da lista.");
  }
  };

  profileName.textContent = user.displayName || "Usuário sem nome";
  profileEmail.textContent = user.email || "email@exemplo.com";
  profileCreated.textContent = formatDate(user.metadata.creationTime);

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();

      profileBio.textContent = userData.bio || "Nenhuma bio adicionada";
      profileImage.src = userData.profileImage || "https://placehold.co/120x120?text=Foto";
      profileFollowers.textContent = userData.followersCount || "0";
      profileFollowing.textContent = userData.followingCount || "0";
      profilePosts.textContent = userData.postsCount || "0";
    } else {
      profileBio.textContent = "Nenhuma bio adicionada";
      profileImage.src = userData.profileImage || "https://placehold.co/120x120?text=Foto";
      profileFollowers.textContent = "0";
      profileFollowing.textContent = "0";
      profilePosts.textContent = "0";
    }
  } catch (error) {
    console.error("Erro ao buscar dados do usuário no Firestore:", error);
    profileBio.textContent = "Nenhuma bio adicionada";
    profileImage.src = userData.profileImage || "https://placehold.co/120x120?text=Foto";
  }

  await loadUserBooks(user.uid);

  document.getElementById("loading").style.display = "none";
  document.getElementById("profile-content").style.display = "block";
});

async function loadUserBooks(uid) {
  try {
    const q = query(collection(db, "livros"), where("userId", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      userBooksContainer.innerHTML = "<p>Nenhum livro encontrado.</p>";
      return;
    }

    userBooksContainer.innerHTML = "";

    snapshot.forEach((doc) => {
      const livro = doc.data();
      const volume = livro.volumeInfo || {};
      const capa = volume.imageLinks?.thumbnail || "https://placehold.co/150x220?text=Sem+Capa";
      const titulo = volume.nome || volume.title || "Sem Título";
      const autor = volume.authors?.[0] || volume.autor || "Autor desconhecido";

      const card = document.createElement("div");
      card.className = "livro-card";
      card.innerHTML = `
        <img src="${capa}" alt="Capa do livro" />
        <h3>${titulo}</h3>
        <p>${autor}</p>
      `;
      userBooksContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar livros:", error);
    userBooksContainer.innerHTML = "<p>Erro ao carregar estante.</p>";
  }
}