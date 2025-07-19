import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-CAyWmuhx_Z4onMkUKwbi9zdXV4SnGZs",
  authDomain: "bookie-8cb30.firebaseapp.com",
  databaseURL: "https://bookie-8cb30-default-rtdb.firebaseio.com",
  projectId: "bookie-8cb30",
  storageBucket: "bookie-8cb30.firebasestorage.app",
  messagingSenderId: "128047446609",
  appId: "1:128047446609:web:114b80f8cbefec190c9670",
  measurementId: "G-GDSGLFFE3M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.email.value;
  const password = loginForm.password.value;
  const button = loginForm.querySelector("button[type=submit]");
  button.disabled = true;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    window.location.href = `${location.origin}/bookie-app/html/Home.html`;

  } catch (error) {
    const errorMessage = document.getElementById("error-message");
    errorMessage.textContent = "E-mail ou senha inválidos.";
  } finally {
    button.disabled = false;
  }
});