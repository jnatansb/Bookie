import { UserService } from "./UserService.js";

export class UserController {
  
  // Cadastrar novo usuário
  static async register(userData) {
    const result = await UserService.createUser(userData);
    return result;
  }
  
  // Buscar perfil do usuário atual
  static async getProfile() {
    const result = await UserService.getCurrentUser();
    return result;
  }
  
  // Buscar usuário por ID
  static async getUserProfile(userId) {
    const result = await UserService.getUserById(userId);
    return result;
  }
  
  // Atualizar perfil
  static async updateProfile(userId, updateData) {
    const result = await UserService.updateUser(userId, updateData);
    return result;
  }
  
  // Deletar conta
  static async deleteAccount(userId) {
    const result = await UserService.deleteUser(userId);
    return result;
  }
  
  // Buscar usuários
  static async searchUsers(searchTerm) {
    const result = await UserService.searchUsersByName(searchTerm);
    return result;
  }
}
