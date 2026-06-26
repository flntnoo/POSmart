import type { User, UserRole } from "@/types/posmart";
import { apiListRequest, apiRequest, jsonBody } from "./api";

export type InviteTeamMemberInput = {
  nama: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "owner">;
};

export const teamService = {
  list() {
    return apiListRequest<User>("/api/team");
  },

  invite(input: InviteTeamMemberInput) {
    return apiRequest<User>("/api/team", {
      method: "POST",
      body: jsonBody(input),
    });
  },
};
