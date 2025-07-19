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
  where,
  orderBy,
  limit
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

// Elementos do DOM
const postForm = document.getElementById("post-form");
const userPostsContainer = document.getElementById("user-posts");
const submitBtn = postForm.querySelector("button[type='submit']");
const btnText = submitBtn.querySelector(".btn-text");
const btnLoading = submitBtn.querySelector(".btn-loading");

// Função para formatar data
function formatDate(timestamp) {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Função para processar tags
function processTags(tagsString) {
  if (!tagsString) return [];
  return tagsString
    .split(",")
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

// Submissão do formulário
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const user = auth.currentUser;
  if (!user) {
    alert("Você precisa estar logado para fazer uma postagem.");
    return;
  }

  // Coletar dados do formulário
  const formData = new FormData(postForm);
  const postData = {
    title: formData.get("title").trim(),
    content: formData.get("content").trim(),
    book: formData.get("book").trim(),
    image: formData.get("image").trim(),
    tags: processTags(formData.get("tags")),
    userId: user.uid,
    userEmail: user.email,
    timestamp: new Date(),
    likes: 0,
    comments: []
  };

  // Validações
  if (!postData.title || !postData.content) {
    alert("Por favor, preencha o título e o conteúdo da postagem.");
    return;
  }

  // Desabilitar botão e mostrar loading
  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnLoading.style.display = "inline";

  try {
    await addDoc(collection(db, "postagens"), postData);
    
    // Resetar formulário
    postForm.reset();
    
    // Recarregar postagens
    loadUserPosts();
    
    alert("Postagem criada com sucesso!");
    
  } catch (error) {
    console.error("Erro ao criar postagem:", error);
    alert("Erro ao criar postagem. Tente novamente.");
  } finally {
    // Reabilitar botão
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
  }
});

// Carregar postagens do usuário
async function loadUserPosts() {
  const user = auth.currentUser;
  if (!user) {
    console.log("Usuário não autenticado");
    userPostsContainer.innerHTML = `
      <div class="empty-state">
        <p>Você precisa estar logado para ver suas postagens.</p>
      </div>
    `;
    return;
  }
  
  console.log("Carregando postagens para usuário:", user.uid);

  try {
    // Primeiro tentar com orderBy, se falhar usar query simples
    let snapshot;
    try {
      const q = query(
        collection(db, "postagens"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      snapshot = await getDocs(q);
    } catch (indexError) {
      console.log("Usando query sem orderBy (índice não encontrado)");
      // Fallback para query simples sem orderBy
      const simpleQ = query(
        collection(db, "postagens"),
        where("userId", "==", user.uid),
        limit(10)
      );
      snapshot = await getDocs(simpleQ);
    }
    
    if (snapshot.empty) {
      userPostsContainer.innerHTML = `
        <div class="empty-state">
          <span class="emoji">📝</span>
          <p>Você ainda não fez nenhuma postagem.</p>
          <p>Que tal começar compartilhando suas reflexões sobre livros?</p>
        </div>
      `;
      return;
    }

    userPostsContainer.innerHTML = "";
    
    // Converter para array e ordenar manualmente se necessário
    const posts = [];
    snapshot.forEach(docSnap => {
      posts.push({
        id: docSnap.id,
        data: docSnap.data()
      });
    });
    
    // Ordenar por timestamp se existe
    posts.sort((a, b) => {
      const timestampA = a.data.timestamp?.toDate?.() || new Date(a.data.timestamp || 0);
      const timestampB = b.data.timestamp?.toDate?.() || new Date(b.data.timestamp || 0);
      return timestampB - timestampA; // Mais recente primeiro
    });
    
    // Criar elementos das postagens
    posts.forEach(post => {
      const postElement = createPostElement(post.id, post.data);
      userPostsContainer.appendChild(postElement);
    });
    
  } catch (error) {
    console.error("Erro ao carregar postagens:", error);
    userPostsContainer.innerHTML = `
      <div class="empty-state">
        <p>Erro ao carregar suas postagens.</p>
        <p style="font-size: 12px; color: #999;">
          ${error.message || "Erro desconhecido"}
        </p>
        <button onclick="loadUserPosts()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #6F257A; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Tentar Novamente
        </button>
      </div>
    `;
  }
}

// Criar elemento de postagem
function createPostElement(postId, post) {
  const postDiv = document.createElement("div");
  postDiv.className = "post-card";
  
  const tagsHtml = post.tags && post.tags.length > 0 
    ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>`
    : "";
    
  const bookHtml = post.book 
    ? `<div class="post-book">📖 ${post.book}</div>`
    : "";
    
  const imageHtml = post.image 
    ? `<img src="${post.image}" alt="Imagem da postagem" style="width: 100%; max-width: 300px; border-radius: 6px; margin: 1rem 0;" onerror="this.style.display='none'">`
    : "";
  
  postDiv.innerHTML = `
    <div class="post-card-header">
      <h4 class="post-title">${post.title}</h4>
      <span class="post-date">${formatDate(post.timestamp)}</span>
    </div>
    <div class="post-content">${post.content}</div>
    ${imageHtml}
    <div class="post-meta">
      ${bookHtml}
      <span>👤 ${post.userEmail}</span>
      <span>❤️ ${post.likes || 0} likes</span>
    </div>
    ${tagsHtml}
    <div class="post-actions">
      <button class="btn-edit" onclick="editPost('${postId}')" title="Editar">✏️</button>
      <button class="btn-delete" onclick="deletePost('${postId}')" title="Excluir">🗑️</button>
    </div>
  `;
  
  return postDiv;
}

// Função para deletar postagem
window.deletePost = async function(postId) {
  if (!confirm("Tem certeza que deseja excluir esta postagem?")) return;
  
  try {
    await deleteDoc(doc(db, "postagens", postId));
    loadUserPosts();
    alert("Postagem excluída com sucesso!");
  } catch (error) {
    console.error("Erro ao excluir postagem:", error);
    alert("Erro ao excluir postagem.");
  }
};

// Função para editar postagem (placeholder - pode ser implementada futuramente)
window.editPost = async function(postId) {
  alert("Funcionalidade de edição será implementada em breve!");
};

// Gerenciar autenticação
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  loadUserPosts();
});

// Logout
document.getElementById("logout-button").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
});

// Menu lateral
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

// Tornar loadUserPosts disponível globalmente para o botão de retry
window.loadUserPosts = loadUserPosts;

// Criar link para postagem no botão do Home
document.addEventListener("DOMContentLoaded", () => {
  // Verificar se existe o botão de "Fazer Postagem" no Home e adicionar link
  const homePostBtn = document.querySelector(".new-post-btn");
  if (homePostBtn && !homePostBtn.onclick) {
    homePostBtn.onclick = () => window.location.href = "postagem.html";
  }
});
