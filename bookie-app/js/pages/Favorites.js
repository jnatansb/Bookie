import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import { getFirestore, collection, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyA-CAyWmuhx_Z4onMkUKwbi9zdXV4SnGZs",
      authDomain: "bookie-8cb30.firebaseapp.com",
      databaseURL: "https://bookie-8cb30-default-rtdb.firebaseio.com",
      projectId: "bookie-8cb30",
      storageBucket: "bookie-8cb30.appspot.com",
      messagingSenderId: "128047446609",
      appId: "1:128047446609:web:114b80f8cbefec190c9670",
      measurementId: "G-GDSGLFFE3M"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const logoutBtn = document.getElementById("logout-button");
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });

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

    const favoritosContainer = document.getElementById("lista-favoritos");

    function criarCardLivro({ capa, titulo, autor, descricao, onRemoverFavorito }) {
      const card = document.createElement("div");
      card.className = "livro-card";

      card.innerHTML = `
        <img src="${capa}" alt="Capa do livro ${titulo}" />
        <h3>${titulo}</h3>
        <p><strong>${autor}</strong></p>
        <p>${descricao.length > 80 ? descricao.substring(0, 80) + "..." : descricao}</p>
      `;

      const btnFavorito = document.createElement("button");
      btnFavorito.className = "btn-favorito";
      btnFavorito.textContent = "Remover Favorito";
      btnFavorito.addEventListener("click", onRemoverFavorito);

      card.appendChild(btnFavorito);

      return card;
    }

    onAuthStateChanged(auth, async (user) => {
      favoritosContainer.innerHTML = "";

      if (!user) {
        favoritosContainer.innerHTML = "<p>Faça login para ver seus favoritos.</p>";
        return;
      }

      try {
        const favoritosRef = collection(db, "favoritos");
        const q = query(favoritosRef, where("usuario.id", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          favoritosContainer.innerHTML = "<p>Nenhum favorito encontrado.</p>";
          return;
        }

        querySnapshot.forEach((docFavorito) => {
          const favorito = docFavorito.data();

          const volumeInfo = favorito.volumeInfo || {};
          const imageLinks = volumeInfo.imageLinks || {};

          const dadosLivro = {
            capa: imageLinks.thumbnail || "https://via.placeholder.com/150x220?text=Sem+Capa",
            titulo: volumeInfo.nome || "Sem Título",
            autor: (volumeInfo.autor && volumeInfo.autor[0]) || "Autor desconhecido",
            descricao: volumeInfo.sinopse || "",
          };


          const card = criarCardLivro({
            ...dadosLivro,
            onRemoverFavorito: async () => {
              try {
                await deleteDoc(doc(db, "favoritos", docFavorito.id));
                favoritosContainer.removeChild(card);
              } catch (error) {
                console.error("Erro ao remover favorito:", error);
                alert("Erro ao remover favorito.");
              }
            }
          });

          favoritosContainer.appendChild(card);
        });
      } catch (error) {
        favoritosContainer.innerHTML = "<p>Erro ao carregar os favoritos.</p>";
        console.error("Erro ao buscar favoritos:", error);
      }
    });