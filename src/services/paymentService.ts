import { mockPayments } from "@/data/mockData";
import type { Payment } from "@/types/posmart";
import { fail, ok } from "./api";

export const paymentService = {
  async list(subscriptionId?: string) {
    const payments = subscriptionId ? mockPayments.filter((item) => item.subscriptionId === subscriptionId) : mockPayments;
    return ok("Riwayat pembayaran berhasil diambil", payments);
  },

  async create(input: Pick<Payment, "subscriptionId" | "jumlah" | "metode"> & { status?: Payment["status"] }) {
    if (input.jumlah < 0) return fail<Payment>("Validasi gagal", { jumlah: "Jumlah pembayaran tidak boleh negatif" });
    const { status, ...paymentInput } = input;
    const payment: Payment = {
      paymentId: `pay-${Date.now()}`,
      status: status ?? "pending",
      paymentDate: new Date().toISOString(),
      ...paymentInput,
    };
    mockPayments.unshift(payment);
    return ok("Payment record berhasil dibuat", payment);
  },

  async updateStatus(paymentId: string, status: Payment["status"]) {
    const payment = mockPayments.find((item) => item.paymentId === paymentId);
    if (!payment) return fail<Payment>("Payment tidak ditemukan");
    payment.status = status;
    payment.paymentDate = new Date().toISOString();
    return ok("Status payment berhasil diperbarui", payment);
  },
};
