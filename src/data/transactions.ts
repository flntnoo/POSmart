import { belongsToWorkspaceOutlet, mockCustomers, mockProducts, mockTransactionDetails, mockTransactions as sourceTransactions, mockUsers } from "@/data/mockData";
import type { Customer as DomainCustomer, Product, Transaction as DomainTransaction, TransactionDetail, User } from "@/types/posmart";

export type TransactionStatus = "Sukses" | "Pending" | "Batal";
export type PaymentMethod = "Tunai" | "Transfer" | "QRIS" | "Kartu";

export type TransactionItem = {
  name: string;
  qty: number;
  price: number;
};

export type Transaction = {
  id: string;
  date: string;
  customer: string;
  cashier: string;
  itemCount: number;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  method: PaymentMethod;
  status: TransactionStatus;
};

function formatDate(value: string) {
  const date = new Date(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function toTransactionView(
  transaction: DomainTransaction,
  options?: {
    details?: TransactionDetail[];
    products?: Product[];
    customers?: DomainCustomer[];
    users?: User[];
  },
): Transaction {
    const details = (options?.details ?? mockTransactionDetails).filter((detail) => detail.transactionId === transaction.transactionId);
    const items = details.map((detail) => {
      const product = (options?.products ?? mockProducts).find((item) => item.productId === detail.productId);
      return {
        name: product?.nama ?? "Produk tidak dikenal",
        qty: detail.quantity,
        price: detail.subtotal / detail.quantity,
      };
    });
    const subtotal = details.reduce((sum, detail) => sum + detail.subtotal, 0);
    const tax = Math.max(transaction.total - subtotal, 0);

    return {
      id: transaction.transactionId,
      date: formatDate(transaction.tanggal),
      customer: (options?.customers ?? mockCustomers).find((customer) => customer.customerId === transaction.customerId)?.nama ?? "Walk-in Customer",
      cashier: (options?.users ?? mockUsers).find((user) => user.userId === transaction.userId)?.nama ?? "Kasir",
      itemCount: details.length,
      items,
      subtotal,
      tax,
      total: transaction.total,
      method: transaction.metode,
      status: transaction.status,
    };
}

export function getMockTransactions(userId?: string): Transaction[] {
  return sourceTransactions
    .filter((transaction) => !userId || belongsToWorkspaceOutlet(transaction.outletId, userId))
    .map((transaction) => toTransactionView(transaction));
}

export const mockTransactions: Transaction[] = getMockTransactions();

export function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
