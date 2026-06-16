import type { UserRole } from "@/types/posmart";

export type NavSection = "main" | "management" | "system";

export type NavigationItem = {
  name: string;
  href: string;
  iconPath: string;
  section: NavSection;
  roles: UserRole[];
  implemented: boolean;
};

export const roleLabels: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  kasir: "Kasir",
};

export const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", iconPath: "/icons/sidebar/home.svg", section: "main", roles: ["owner", "admin", "kasir"], implemented: true },
  { name: "Analytics", href: "/analytics", iconPath: "/icons/sidebar/home.svg", section: "main", roles: ["owner", "admin"], implemented: true },
  { name: "Kasir", href: "/pos", iconPath: "/icons/sidebar/pos.svg", section: "main", roles: ["owner", "admin", "kasir"], implemented: true },
  { name: "Transaksi", href: "/transactions", iconPath: "/icons/sidebar/transaction.svg", section: "main", roles: ["owner", "admin", "kasir"], implemented: true },
  { name: "Produk", href: "/products", iconPath: "/icons/sidebar/product.svg", section: "main", roles: ["owner", "admin"], implemented: true },
  { name: "Kategori", href: "/categories", iconPath: "/icons/sidebar/product.svg", section: "management", roles: ["owner", "admin"], implemented: true },
  { name: "Supplier", href: "/suppliers", iconPath: "/icons/sidebar/supplier.svg", section: "management", roles: ["owner", "admin"], implemented: true },
  { name: "Inventory", href: "/inventory", iconPath: "/icons/sidebar/product.svg", section: "management", roles: ["owner", "admin"], implemented: true },
  { name: "Pelanggan", href: "/customers", iconPath: "/icons/sidebar/customer.svg", section: "management", roles: ["owner", "admin", "kasir"], implemented: true },
  { name: "Outlet", href: "/outlets", iconPath: "/icons/sidebar/settings.svg", section: "management", roles: ["owner", "admin"], implemented: true },
  { name: "Tim", href: "/team", iconPath: "/icons/sidebar/team.svg", section: "management", roles: ["owner"], implemented: true },
  { name: "Pengaturan", href: "/settings", iconPath: "/icons/sidebar/settings.svg", section: "system", roles: ["owner", "admin"], implemented: true },
  { name: "Subscription", href: "/subscription", iconPath: "/icons/sidebar/subscription.svg", section: "system", roles: ["owner"], implemented: true },
  { name: "Payments", href: "/payments", iconPath: "/icons/sidebar/subscription.svg", section: "system", roles: ["owner"], implemented: true },
  { name: "Onboarding", href: "/onboarding", iconPath: "/icons/sidebar/settings.svg", section: "system", roles: ["owner"], implemented: false },
  { name: "Notifications", href: "/notifications", iconPath: "/icons/sidebar/settings.svg", section: "system", roles: ["owner", "admin"], implemented: true },
  { name: "Audit Logs", href: "/audit-logs", iconPath: "/icons/sidebar/settings.svg", section: "system", roles: ["owner", "admin"], implemented: true },
  { name: "Profile", href: "/profile", iconPath: "/icons/sidebar/customer.svg", section: "system", roles: ["owner", "admin", "kasir"], implemented: true },
];

export function canAccessPath(role: UserRole, pathname: string) {
  const item = navigationItems.find((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`));
  if (!item) return true;
  return item.roles.includes(role);
}

export function getVisibleNavigation(role: UserRole, section: NavSection) {
  return navigationItems.filter((item) => item.section === section && item.implemented && item.roles.includes(role));
}
