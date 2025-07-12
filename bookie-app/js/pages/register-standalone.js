// Configuração do Firebase
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

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Classe UserService sem imports
class UserService {
  static async createUser(userData) {
    try {
      const { email, password, name, bio = "", profileImage = "" } = userData;
      
      // Criar usuário no Firebase Auth
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Atualizar perfil do usuário
      await user.updateProfile({
        displayName: name,
        photoURL: profileImage
      });
      
      // Salvar dados adicionais no Firestore
      const userDoc = {
        uid: user.uid,
        name: name,
        email: email,
        bio: bio,
        profileImage: profileImage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        postsCount: 0
      };
      
      await db.collection("users").doc(user.uid).set(userDoc);
      
      return {
        success: true,
        user: userDoc,
        message: "Usuário cadastrado com sucesso!"
      };
      
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  }
  
  static getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'Este e-mail já está sendo usado por outra conta.',
      'auth/invalid-email': 'E-mail inválido.',
      'auth/operation-not-allowed': 'Operação não permitida.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
      'auth/user-disabled': 'Esta conta foi desabilitada.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/requires-recent-login': 'Esta operação requer login recente.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.'
    };
    
    return errorMessages[errorCode] || 'Erro desconhecido. Tente novamente.';
  }
}

// Código do formulário
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
    
    const result = await UserService.createUser(userData);
    
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
