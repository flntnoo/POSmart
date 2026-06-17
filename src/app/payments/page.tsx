"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/layouts/DashboardLayout";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { paymentService, subscriptionService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { Payment, Subscription } from "@/types/posmart";
import { CheckCircle2, CreditCard, Info, RefreshCw } from "lucide-react";

function formatRp(value: number) {
  return "Rp " + value.toLocaleString("id-ID");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

const statusStyles: Record<Payment["status"], string> = {
  pending: "bg-yellow-50 text-yellow-600",
  success: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-500",
  expired: "bg-gray-100 text-gray-500",
};

const subscriptionStatusStyles: Record<Subscription["status"], string> = {
  active: "bg-green-50 text-green-600",
  pending: "bg-yellow-50 text-yellow-600",
  expired: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-50 text-red-500",
};

export default function PaymentsPage() {
  const router = useRouter();
  const { currentUser } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [paymentResponse, subscriptionResponse] = await Promise.all([
      paymentService.list(),
      subscriptionService.list(),
    ]);

    if (paymentResponse.success && paymentResponse.data) setPayments(paymentResponse.data);
    else setError(paymentResponse.message);

    if (subscriptionResponse.success && subscriptionResponse.data) setSubscriptions(subscriptionResponse.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const userSubscriptions = useMemo(() => {
    if (!currentUser) return subscriptions;
    return subscriptions.filter((subscription) => subscription.userId === currentUser.userId);
  }, [currentUser, subscriptions]);

  const subscriptionById = useMemo(() => new Map(subscriptions.map((subscription) => [subscription.subscriptionId, subscription])), [subscriptions]);

  const userPayments = useMemo(() => {
    const ids = new Set(userSubscriptions.map((subscription) => subscription.subscriptionId));
    return payments.filter((payment) => ids.has(payment.subscriptionId));
  }, [payments, userSubscriptions]);

  const latestSubscription = userSubscriptions[0] ?? null;
  const latestPayment = latestSubscription ? userPayments.find((payment) => payment.subscriptionId === latestSubscription.subscriptionId) ?? null : null;
  const canContinue = latestSubscription?.status === "active" || latestPayment?.status === "success";

  async function simulatePaymentSuccess() {
    if (!latestSubscription || !latestPayment || !currentUser) return;
    setProcessing(true);
    setError("");
    const paymentResponse = await paymentService.updateStatus(latestPayment.paymentId, "success");

    if (!paymentResponse.success) {
      setError(paymentResponse.message);
      setProcessing(false);
      return;
    }

    setSuccess("Payment mock berhasil. Subscription sudah aktif.");
    await load();
    setProcessing(false);
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Status Pembayaran</h1>
          <p className="mt-0.5 text-sm text-gray-500">Cek payment record subscription sebelum lanjut onboarding</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RefreshCw size={14} />
          Muat Ulang
        </button>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-[20px] border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <Info size={17} className="mt-0.5 flex-shrink-0" />
        <p>Midtrans masih placeholder. Tombol simulasi mengubah status payment di backend dan mengaktifkan subscription.</p>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {loading ? <LoadingState title="Memuat payment record..." /> : error ? <ErrorState title="Gagal memuat pembayaran" description={error} /> : (
        <div className="space-y-5">
          {latestSubscription && (
            <div className="rounded-[20px] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Subscription Terbaru</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-gray-900">{latestSubscription.paket}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {latestSubscription.startDate ?? "-"} sampai {latestSubscription.endDate ?? "-"}
                  </p>
                </div>
                <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${subscriptionStatusStyles[latestSubscription.status]}`}>
                  {latestSubscription.status}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {latestPayment?.status === "pending" && (
                  <button
                    onClick={simulatePaymentSuccess}
                    disabled={processing}
                    className="rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processing ? "Memproses..." : "Simulasikan Pembayaran Berhasil"}
                  </button>
                )}
                <button
                  onClick={() => router.push("/onboarding")}
                  disabled={!canContinue}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lanjut Onboarding
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-[20px] bg-white shadow-sm">
            {userPayments.length === 0 ? (
              <EmptyState title="Belum ada payment record" description="Pilih paket subscription terlebih dahulu untuk membuat payment record." actionHref="/subscription" actionLabel="Pilih Paket" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Paket</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Jumlah</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Metode</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Tanggal</th>
                    <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userPayments.map((payment) => {
                    const subscription = subscriptionById.get(payment.subscriptionId);
                    return (
                      <tr key={payment.paymentId} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]"><CreditCard size={18} /></div>
                            <div>
                              <p className="font-semibold text-gray-800">{payment.paymentId}</p>
                              <p className="text-xs text-gray-400">{payment.subscriptionId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-700">{subscription?.paket ?? "-"}</td>
                        <td className="px-4 py-4 font-bold text-gray-900">{formatRp(payment.jumlah)}</td>
                        <td className="px-4 py-4 text-gray-500">{payment.metode ?? "-"}</td>
                        <td className="px-4 py-4 text-gray-500">{formatDate(payment.paymentDate)}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusStyles[payment.status]}`}>{payment.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
