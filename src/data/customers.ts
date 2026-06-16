import type { Customer as DomainCustomer, Transaction } from "@/types/posmart";
import { mockCustomers as sourceCustomers, mockTransactionDetails, mockTransactions } from "@/data/mockData";

export type CustomerTier = "Gold" | "Silver" | "Bronze" | "Member";
export type CustomerStatus = "Aktif" | "Tidak Aktif";
export type RecentTx = { name: string; date: string; amount: number };

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalTransactions: number;
  totalSpent: number;
  lastTransaction: string;
  joinDate: string;
  visits: number;
  status: CustomerStatus;
  tier: CustomerTier;
  recentItems: string[];
  recentTx: RecentTx[];
};

export function calcTier(spent: number, txCount: number): CustomerTier {
  if (spent >= 20_000_000 || txCount >= 8) return "Gold";
  if (spent >= 10_000_000 || txCount >= 5) return "Silver";
  if (spent >= 5_000_000 || txCount >= 3) return "Bronze";
  return "Member";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function toCustomerView(customer: DomainCustomer, transactions: Transaction[] = mockTransactions): Customer {
  const customerTransactions = transactions.filter((transaction) => transaction.customerId === customer.customerId);
  const totalSpent = customerTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
  const recentTx = customerTransactions.map((transaction) => ({
    name: transaction.transactionId,
    date: formatDate(transaction.tanggal),
    amount: transaction.total,
  }));
  const recentItems = customerTransactions.flatMap((transaction) =>
    mockTransactionDetails
      .filter((detail) => detail.transactionId === transaction.transactionId)
      .map((detail) => detail.productId)
  );

  return {
    id: customer.customerId,
    name: customer.nama,
    phone: customer.telepon ?? "-",
    email: customer.email ?? "-",
    totalTransactions: customerTransactions.length,
    totalSpent,
    lastTransaction: formatDate(customerTransactions[0]?.tanggal),
    joinDate: "01 Jun 2026",
    visits: Math.max(customerTransactions.length, 1),
    status: customerTransactions.length > 0 ? "Aktif" : "Tidak Aktif",
    tier: calcTier(totalSpent, customerTransactions.length),
    recentItems,
    recentTx,
  };
}

export const mockCustomers: Customer[] = sourceCustomers.map((customer) => toCustomerView(customer, mockTransactions));

export function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function formatRpShort(n: number): string {
  if (n >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(1) + " M";
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + " Jt";
  if (n >= 1_000) return "Rp " + (n / 1_000).toFixed(0) + " Rb";
  return "Rp " + n;
}

const AVATAR_COLORS: [string, string][] = [
  ["#FFF3E0", "#E65100"],
  ["#E3F2FD", "#1565C0"],
  ["#E8F5E9", "#2E7D32"],
  ["#F3E5F5", "#6A1B9A"],
];

export function avatarColor(idx: number): [string, string] {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}
