import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./FirebaseConfig.js";

const form = document.getElementById("forgot-form");
const message = document.getElementById("status-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.email.value.trim();

  try {
    await sendPasswordResetEmail(auth, email);
    message.style.color = "#4CAF50";
    message.textContent = "Instruções de recuperação enviadas para seu e-mail.";
  } catch (error) {
    console.error(error);
    message.style.color = "#B02124";

    if (error.code === "auth/user-not-found") {
      message.textContent = "Não encontramos nenhuma conta com esse e-mail.";
    } else if (error.code === "auth/invalid-email") {
      message.textContent = "Formato de e-mail inválido.";
    } else {
      message.textContent = "Erro ao enviar o e-mail. Tente novamente.";
    }
  }
});