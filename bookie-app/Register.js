import { UserController } from "../bookie-api/UserController.js";

const registerForm = document.getElementById("register-form");
const errorMessage = document.getElementById("error-message");
const successMessage = document.getElementById("success-message");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Limpar mensagens anteriores
  errorMessage.textContent = "";
  successMessage.textContent = "";
  
  const formData = new FormData(registerForm);
  const userData = {
    name: formData.get("name").trim(),
    email: formData.get("email").trim(),
    password: formData.get("password"),
    bio: formData.get("bio").trim(),
    profileImage: formData.get("profileImage").trim()
  };
  
  // Validações básicas
  if (!userData.name || !userData.email || !userData.password) {
    errorMessage.textContent = "Por favor, preencha todos os campos obrigatórios.";
    return;
  }
  
  if (userData.password.length < 6) {
    errorMessage.textContent = "A senha deve ter pelo menos 6 caracteres.";
    return;
  }
  
  const button = registerForm.querySelector("button[type=submit]");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Cadastrando...";
  
  try {
    console.log("Tentando cadastrar usuário:", { ...userData, password: "***" });
    
    const result = await UserController.register(userData);
    
    console.log("Resultado do cadastro:", result);
    
    if (result.success) {
      successMessage.textContent = result.message;
      registerForm.reset();
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 2000);
    } else {
      errorMessage.textContent = result.message;
    }
  } catch (error) {
    console.error("Erro no cadastro:", error);
    errorMessage.textContent = "Erro interno. Tente novamente.";
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});
