import { belongsToWorkspaceOutlet, mockTransactionDetails, mockTransactions } from "@/data/mockData";
import type { Transaction, TransactionDetail } from "@/types/posmart";
import { fail, ok } from "./api";

export type CreateTransactionInput = Omit<Transaction, "transactionId" | "tanggal" | "total"> & {
  items: Array<Pick<TransactionDetail, "productId" | "quantity" | "subtotal">>;
};

export const transactionService = {
  async list(filters?: { outletId?: string; customerId?: string; userId?: string }) {
    const transactions = mockTransactions.filter((transaction) => {
      if (filters?.outletId && transaction.outletId !== filters.outletId) return false;
      if (filters?.customerId && transaction.customerId !== filters.customerId) return false;
      if (filters?.userId && !belongsToWorkspaceOutlet(transaction.outletId, filters.userId)) return false;
      return true;
    });
    return ok("Daftar transaksi berhasil diambil", transactions);
  },

  async detail(transactionId: string) {
    const transaction = mockTransactions.find((item) => item.transactionId === transactionId);
    if (!transaction) return fail<{ transaction: Transaction; details: TransactionDetail[] }>("Transaksi tidak ditemukan");
    return ok("Detail transaksi berhasil diambil", {
      transaction,
      details: mockTransactionDetails.filter((item) => item.transactionId === transactionId),
    });
  },

  async create(input: CreateTransactionInput) {
    if (!input.items.length) return fail<Transaction>("Validasi gagal", { items: "Minimal satu item transaksi" });
    if (input.items.some((item) => item.quantity <= 0)) return fail<Transaction>("Validasi gagal", { quantity: "Quantity harus lebih dari 0" });
    const total = input.items.reduce((sum, item) => sum + item.subtotal, 0);
    if (total < 0) return fail<Transaction>("Validasi gagal", { total: "Total tidak boleh negatif" });
    const timestamp = new Date().toISOString();
    const transaction: Transaction = {
      transactionId: `TRX-${Date.now()}`,
      tanggal: timestamp,
      total,
      customerId: input.customerId,
      userId: input.userId,
      outletId: input.outletId,
      metode: input.metode,
      status: input.status,
    };
    const details: TransactionDetail[] = input.items.map((item, index) => ({
      detailId: `detail-${Date.now()}-${index + 1}`,
      transactionId: transaction.transactionId,
      productId: item.productId,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    mockTransactions.unshift(transaction);
    mockTransactionDetails.push(...details);

    return ok("Transaksi berhasil dibuat", transaction);
  },
};
