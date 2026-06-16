import { mockUsers } from "@/data/mockData";
import type { User, UserRole } from "@/types/posmart";
import { fail, ok } from "./api";

export type LoginInput = {
  email: string;
  password: string;
  role?: UserRole;
};

export type RegisterInput = {
  nama: string;
  email: string;
  password: string;
  role?: UserRole;
};

export const authService = {
  async login(input: LoginInput) {
    const user = mockUsers.find((item) => item.email === input.email);
    if (!user) {
      return fail<User>("Email atau password salah", { email: "Email tidak terdaftar" });
    }
    if (input.role && user.role !== input.role) {
      return fail<User>("Role tidak sesuai", { role: "Akun tidak memiliki akses role tersebut" });
    }
    return ok("Login berhasil", user);
  },

  async register(input: RegisterInput) {
    if (mockUsers.some((item) => item.email === input.email)) {
      return fail<User>("Email sudah digunakan", { email: "Email sudah terdaftar" });
    }
    const now = new Date().toISOString();
    const user: User = {
      userId: `user-${Date.now()}`,
      nama: input.nama,
      email: input.email,
      role: input.role ?? "owner",
      createdAt: now,
      updatedAt: now,
    };
    mockUsers.unshift(user);
    return ok("Registrasi berhasil", user);
  },

  async logout() {
    return ok("Logout berhasil", null);
  },

  async session() {
    return ok("Session aktif", mockUsers[0]);
  },
};
