import type { User, UserRole } from "@/types/posmart";
import { apiRequest, jsonBody } from "./api";

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
  login(input: LoginInput) {
    return apiRequest<User>("/api/auth/login", {
      method: "POST",
      body: jsonBody(input),
    });
  },

  register(input: RegisterInput) {
    return apiRequest<User>("/api/auth/register", {
      method: "POST",
      body: jsonBody(input),
    });
  },

  logout() {
    return apiRequest<null>("/api/auth/logout", { method: "POST" });
  },

  session() {
    return apiRequest<User>("/api/auth/session");
  },
};
