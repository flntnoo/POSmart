import { getVisibleNavigation } from "@/lib/rbac";
import type { UserRole } from "@/types/posmart";

export function getSidebarMenus(role: UserRole) {
  return {
    mainMenu: getVisibleNavigation(role, "main"),
    managementMenu: getVisibleNavigation(role, "management"),
    systemMenu: getVisibleNavigation(role, "system").filter((item) => item.href !== "/profile"),
  };
}
