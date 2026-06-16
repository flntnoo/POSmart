import { belongsToWorkspaceOutlet, mockProducts, mockTransactionDetails, mockTransactions } from "@/data/mockData";
import type { AnalyticsSummary } from "@/types/posmart";
import { ok } from "./api";

export const analyticsService = {
  async summary(filters?: { outletId?: string; startDate?: string; endDate?: string; userId?: string }) {
    const transactions = mockTransactions.filter((transaction) => {
      if (filters?.outletId && transaction.outletId !== filters.outletId) return false;
      if (filters?.userId && !belongsToWorkspaceOutlet(transaction.outletId, filters.userId)) return false;
      if (filters?.startDate && transaction.tanggal.slice(0, 10) < filters.startDate) return false;
      if (filters?.endDate && transaction.tanggal.slice(0, 10) > filters.endDate) return false;
      return transaction.status === "Sukses";
    });
    const transactionIds = new Set(transactions.map((item) => item.transactionId));
    const details = mockTransactionDetails.filter((item) => transactionIds.has(item.transactionId));
    const byProduct = new Map<string, { quantity: number; revenue: number }>();

    for (const detail of details) {
      const current = byProduct.get(detail.productId) ?? { quantity: 0, revenue: 0 };
      byProduct.set(detail.productId, {
        quantity: current.quantity + detail.quantity,
        revenue: current.revenue + detail.subtotal,
      });
    }

    const produkTerlaris = [...byProduct.entries()]
      .map(([productId, value]) => ({
        productId,
        nama: mockProducts.find((product) => product.productId === productId)?.nama ?? "Produk tidak dikenal",
        ...value,
      }))
      .sort((a, b) => b.quantity - a.quantity);

    const trendByDate = new Map<string, number>();
    for (const transaction of transactions) {
      const label = transaction.tanggal.slice(0, 10);
      trendByDate.set(label, (trendByDate.get(label) ?? 0) + transaction.total);
    }

    const data: AnalyticsSummary = {
      totalPendapatan: transactions.reduce((sum, transaction) => sum + transaction.total, 0),
      jumlahTransaksi: transactions.length,
      produkTerlaris,
      trenPendapatan: [...trendByDate.entries()]
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    };

    return ok("Ringkasan analytics berhasil diambil", data);
  },
};
