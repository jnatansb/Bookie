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
  serverTimestamp,
  getDoc
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

// Elementos DOM
const bookImage = document.getElementById("book-image");
const bookTitle = document.getElementById("book-title");
const bookAuthor = document.getElementById("book-author");
const bookDescription = document.getElementById("book-description");
const favoriteBtn = document.getElementById("favorite-btn");
const addReviewBtn = document.getElementById("add-review-btn");
const reviewForm = document.getElementById("review-form");
const reviewFormElement = document.getElementById("review-form-element");
const cancelReviewBtn = document.getElementById("cancel-review");
const reviewsList = document.getElementById("reviews-list");
const stars = document.querySelectorAll(".star");
const ratingInput = document.getElementById("rating");

let currentBookId = null;
let currentBookData = null;
let currentUser = null;

// Obter ID do livro da URL
function getBookIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('bookId');
}

// Carregar dados do livro
async function loadBookData(bookId) {
  try {
    const bookDoc = await getDoc(doc(db, "livros", bookId));
    if (bookDoc.exists()) {
      const data = bookDoc.data();
      currentBookData = data;
      
      // Preencher informações do livro
      const volumeInfo = data.volumeInfo;
      bookTitle.textContent = volumeInfo.nome || 'Título não disponível';
      bookAuthor.textContent = volumeInfo.autor?.[0] || 'Autor desconhecido';
      bookDescription.textContent = volumeInfo.sinopse || 'Descrição não disponível';
      bookImage.src = volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/200x300?text=Sem+Capa';
      bookImage.alt = volumeInfo.nome || 'Capa do livro';
      
      // Atualizar botão de favorito
      const isFavorite = data.isFavorite || false;
      favoriteBtn.textContent = isFavorite ? '❤️ Favoritado' : '🤍 Favoritar';
      favoriteBtn.classList.toggle('favorited', isFavorite);
      
    } else {
      alert('Livro não encontrado!');
      window.location.href = 'Home.html';
    }
  } catch (error) {
    console.error('Erro ao carregar livro:', error);
    alert('Erro ao carregar dados do livro');
  }
}

// Sistema de avaliação por estrelas
stars.forEach((star, index) => {
  star.addEventListener('click', () => {
    const rating = index + 1;
    ratingInput.value = rating;
    updateStarsDisplay(rating);
  });
  
  star.addEventListener('mouseover', () => {
    updateStarsDisplay(index + 1);
  });
});

document.querySelector('.stars').addEventListener('mouseleave', () => {
  updateStarsDisplay(parseInt(ratingInput.value) || 0);
});

function updateStarsDisplay(rating) {
  stars.forEach((star, index) => {
    star.classList.toggle('active', index < rating);
  });
}

// Mostrar/esconder formulário de resenha
addReviewBtn.addEventListener('click', () => {
  reviewForm.classList.remove('hidden');
  addReviewBtn.style.display = 'none';
});

cancelReviewBtn.addEventListener('click', () => {
  reviewForm.classList.add('hidden');
  addReviewBtn.style.display = 'block';
  reviewFormElement.reset();
  ratingInput.value = '0';
  updateStarsDisplay(0);
});

// Submeter resenha
reviewFormElement.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!currentUser) {
    alert('Você precisa estar logado para escrever uma resenha');
    return;
  }
  
  const rating = parseInt(ratingInput.value);
  const reviewText = document.getElementById('review-text').value.trim();
  
  if (rating === 0) {
    alert('Por favor, selecione uma avaliação');
    return;
  }
  
  if (!reviewText) {
    alert('Por favor, escreva sua resenha');
    return;
  }
  
  try {
    // Verificar se o usuário já escreveu uma resenha para este livro
    const existingReviewQuery = query(
      collection(db, "resenhas"),
      where("bookId", "==", currentBookId),
      where("userId", "==", currentUser.uid)
    );
    const existingReviews = await getDocs(existingReviewQuery);
    
    if (!existingReviews.empty) {
      alert('Você já escreveu uma resenha para este livro');
      return;
    }
    
    // Adicionar nova resenha
    await addDoc(collection(db, "resenhas"), {
      bookId: currentBookId,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      rating: rating,
      reviewText: reviewText,
      timestamp: serverTimestamp(),
      bookTitle: currentBookData.volumeInfo.nome
    });
    
    alert('Resenha publicada com sucesso!');
    
    // Esconder formulário e recarregar resenhas
    reviewForm.classList.add('hidden');
    addReviewBtn.style.display = 'block';
    reviewFormElement.reset();
    ratingInput.value = '0';
    updateStarsDisplay(0);
    
    loadReviews();
    
  } catch (error) {
    console.error('Erro ao salvar resenha:', error);
    alert('Erro ao publicar resenha');
  }
});

// Carregar resenhas
async function loadReviews() {
  try {
    reviewsList.innerHTML = '<p class="loading">Carregando resenhas...</p>';
    
    const reviewsQuery = query(
      collection(db, "resenhas"),
      where("bookId", "==", currentBookId)
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    if (reviewsSnapshot.empty) {
      reviewsList.innerHTML = '<p class="no-reviews">Nenhuma resenha ainda. Seja o primeiro a avaliar!</p>';
      return;
    }
    
    // Converter para array e ordenar por timestamp
    const reviews = [];
    reviewsSnapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    // Ordenar por timestamp (mais recente primeiro)
    reviews.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return b.timestamp.toMillis() - a.timestamp.toMillis();
      }
      return 0;
    });
    
    // Renderizar resenhas
    reviewsList.innerHTML = '';
    reviews.forEach(review => {
      const reviewElement = createReviewElement(review);
      reviewsList.appendChild(reviewElement);
    });
    
    // Verificar se usuário já tem resenha
    const userHasReview = reviews.some(review => review.userId === currentUser?.uid);
    if (userHasReview) {
      addReviewBtn.style.display = 'none';
    } else {
      addReviewBtn.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Erro ao carregar resenhas:', error);
    reviewsList.innerHTML = '<p class="loading">Erro ao carregar resenhas</p>';
  }
}

// Criar elemento de resenha
function createReviewElement(review) {
  const reviewDiv = document.createElement('div');
  reviewDiv.className = 'review-item';
  
  // Verificar se é resenha do usuário atual
  const isMyReview = currentUser && review.userId === currentUser.uid;
  if (isMyReview) {
    reviewDiv.classList.add('my-review');
  }
  
  // Gerar estrelas
  const starsHtml = Array.from({length: 5}, (_, i) => 
    i < review.rating ? '⭐' : '☆'
  ).join('');
  
  // Formatar data
  let dateStr = 'Data não disponível';
  if (review.timestamp) {
    try {
      dateStr = review.timestamp.toDate().toLocaleDateString('pt-BR');
    } catch (e) {
      dateStr = 'Data não disponível';
    }
  }
  
  reviewDiv.innerHTML = `
    <div class="review-header">
      <div>
        <div class="review-author">${review.userEmail || 'Usuário anônimo'}</div>
        <div class="review-rating">${starsHtml}</div>
      </div>
      <div class="review-actions">
        <span class="review-date">${dateStr}</span>
        ${isMyReview ? `<button class="delete-review-btn" onclick="deleteReview('${review.id}')">Excluir</button>` : ''}
      </div>
    </div>
    <div class="review-text">${review.reviewText}</div>
  `;
  
  return reviewDiv;
}

// Deletar resenha
window.deleteReview = async function(reviewId) {
  if (!confirm('Tem certeza que deseja excluir sua resenha?')) return;
  
  try {
    await deleteDoc(doc(db, "resenhas", reviewId));
    alert('Resenha excluída com sucesso!');
    loadReviews();
  } catch (error) {
    console.error('Erro ao excluir resenha:', error);
    alert('Erro ao excluir resenha');
  }
};

// Favoritar livro
favoriteBtn.addEventListener('click', async () => {
  if (!currentUser) {
    alert('Você precisa estar logado');
    return;
  }
  
  try {
    const isFavorite = currentBookData.isFavorite || false;
    
    // Atualizar no documento do livro
    await updateDoc(doc(db, "livros", currentBookId), {
      isFavorite: !isFavorite
    });
    
    const favoritosRef = collection(db, "favoritos");
    
    if (!isFavorite) {
      // Adicionar aos favoritos
      await addDoc(favoritosRef, {
        volumeInfo: currentBookData.volumeInfo,
        usuario: { id: currentUser.uid, email: currentUser.email },
        timestamp: serverTimestamp()
      });
    } else {
      // Remover dos favoritos
      const q = query(favoritosRef, where("usuario.id", "==", currentUser.uid));
      const favSnap = await getDocs(q);
      favSnap.forEach(async (favDoc) => {
        if (favDoc.data().volumeInfo?.nome === currentBookData.volumeInfo?.nome) {
          await deleteDoc(doc(db, "favoritos", favDoc.id));
        }
      });
    }
    
    // Atualizar interface
    currentBookData.isFavorite = !isFavorite;
    favoriteBtn.textContent = !isFavorite ? '❤️ Favoritado' : '🤍 Favoritar';
    favoriteBtn.classList.toggle('favorited', !isFavorite);
    
  } catch (error) {
    console.error('Erro ao favoritar:', error);
    alert('Erro ao favoritar livro');
  }
});

// Autenticação
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  
  currentUser = user;
  currentBookId = getBookIdFromURL();
  
  if (!currentBookId) {
    alert('ID do livro não fornecido');
    window.location.href = 'Home.html';
    return;
  }
  
  loadBookData(currentBookId);
  loadReviews();
});

// Logout
document.getElementById("logout-button").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
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
