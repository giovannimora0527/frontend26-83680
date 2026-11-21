import { Usuario } from './usuario';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: number;
  usuario: Usuario;
}
