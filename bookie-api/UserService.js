import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  updatePassword,
  deleteUser,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { auth } from "./FirebaseConfig.js";

const db = getFirestore();

export class UserService {
  
  // CREATE - Cadastrar novo usuário
  static async createUser(userData) {
    try {
      const { email, password, name, bio = "", profileImage = "" } = userData;
      
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Atualizar perfil do usuário
      await updateProfile(user, {
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
      
      await setDoc(doc(db, "users", user.uid), userDoc);
      
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
  
  // READ - Buscar usuário por ID
  static async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (userDoc.exists()) {
        return {
          success: true,
          user: userDoc.data()
        };
      } else {
        return {
          success: false,
          message: "Usuário não encontrado"
        };
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return {
        success: false,
        error: error.code,
        message: "Erro ao buscar usuário"
      };
    }
  }
  
  // READ - Buscar usuário atual logado
  static async getCurrentUser() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userData = await this.getUserById(user.uid);
          resolve(userData);
        } else {
          resolve({
            success: false,
            message: "Usuário não autenticado"
          });
        }
      });
    });
  }
  
  // READ - Buscar usuários por nome
  static async searchUsersByName(searchTerm) {
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef, 
        where("name", ">=", searchTerm),
        where("name", "<=", searchTerm + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push(doc.data());
      });
      
      return {
        success: true,
        users: users
      };
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return {
        success: false,
        error: error.code,
        message: "Erro ao buscar usuários"
      };
    }
  }
  
  // UPDATE - Atualizar dados do usuário
  static async updateUser(userId, updateData) {
    try {
      const user = auth.currentUser;
      
      if (!user || user.uid !== userId) {
        return {
          success: false,
          message: "Não autorizado a atualizar este usuário"
        };
      }
      
      const { name, bio, profileImage, password } = updateData;
      const updates = {
        updatedAt: new Date().toISOString()
      };
      
      // Atualizar nome e foto no Firebase Auth se fornecidos
      if (name || profileImage) {
        const profileUpdates = {};
        if (name) profileUpdates.displayName = name;
        if (profileImage) profileUpdates.photoURL = profileImage;
        
        await updateProfile(user, profileUpdates);
      }
      
      // Preparar dados para atualizar no Firestore
      if (name) updates.name = name;
      if (bio !== undefined) updates.bio = bio;
      if (profileImage !== undefined) updates.profileImage = profileImage;
      
      // Atualizar senha se fornecida
      if (password) {
        await updatePassword(user, password);
      }
      
      // Atualizar documento no Firestore
      await updateDoc(doc(db, "users", userId), updates);
      
      return {
        success: true,
        message: "Usuário atualizado com sucesso!"
      };
      
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  }
  
  // DELETE - Deletar usuário
  static async deleteUser(userId) {
    try {
      const user = auth.currentUser;
      
      if (!user || user.uid !== userId) {
        return {
          success: false,
          message: "Não autorizado a deletar este usuário"
        };
      }
      
      // Deletar documento do Firestore
      await deleteDoc(doc(db, "users", userId));
      
      // Deletar usuário do Firebase Auth
      await deleteUser(user);
      
      return {
        success: true,
        message: "Usuário deletado com sucesso!"
      };
      
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      return {
        success: false,
        error: error.code,
        message: this.getErrorMessage(error.code)
      };
    }
  }
  
  // Método auxiliar para traduzir códigos de erro
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
