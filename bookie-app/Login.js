import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../bookie-api/FirebaseConfig";

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.email.value;
  const password = loginForm.password.value;
  const button = loginForm.querySelector("button[type=submit]");
  button.disabled = true;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "/Home.html";
  } catch (error) {
    const errorMessage = document.getElementById("error-message");
    errorMessage.textContent = "E-mail ou senha inválidos.";
  } finally {
    button.disabled = false;
  }
});