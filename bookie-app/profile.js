import { UserController } from "../bookie-api/UserController.js";
import { auth } from "../bookie-api/FirebaseConfig.js";
import { signOut, onAuthStateChanged } from "firebase/auth";

const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const profileContent = document.getElementById("profile-content");

// Verificar autenticação e carregar perfil
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadProfile();
  } else {
    window.location.href = "login.html";
  }
});

async function loadProfile() {
  try {
    loadingDiv.style.display = "block";
    errorDiv.style.display = "none";
    profileContent.style.display = "none";
    
    const result = await UserController.getProfile();
    
    if (result.success) {
      displayProfile(result.user);
    } else {
      showError(result.message);
    }
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    showError("Erro ao carregar perfil");
  } finally {
    loadingDiv.style.display = "none";
  }
}

function displayProfile(user) {
  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;
  document.getElementById("profile-bio").textContent = user.bio || "Nenhuma bio adicionada";
  document.getElementById("profile-image").src = user.profileImage || "default-profile-image.jpg";
  profileContent.style.display = "block";
  document.getElementById("logout-button").style.display = "block";
}
