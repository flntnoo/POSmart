"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/layouts/DashboardLayout";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/AppState";
import { auditLogService, notificationService, paymentService, subscriptionService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import type { Subscription, SubscriptionPackage } from "@/types/posmart";
import { Check, CreditCard, Info, Star, Zap } from "lucide-react";

type Plan = {
  paket: SubscriptionPackage;
  price: number;
  desc: string;
  features: string[];
  recommended?: boolean;
};

const planDetails: Record<SubscriptionPackage, Omit<Plan, "paket" | "price">> = {
  Free: {
    desc: "Untuk mencoba alur POSmart dasar.",
    features: ["1 owner", "Data awal terbatas", "Cocok untuk eksplorasi"],
  },
  Basic: {
    desc: "Untuk UMKM yang mulai aktif bertransaksi.",
    features: ["Multi produk", "Inventory dasar", "Dashboard penjualan", "Payment record"],
    recommended: true,
  },
  Pro: {
    desc: "Untuk usaha yang butuh kapasitas operasional lebih besar.",
    features: ["Semua fitur Basic", "Multi outlet", "Analytics lebih lengkap", "Prioritas support"],
  },
};

function formatRp(value: number) {
  if (value === 0) return "Gratis";
  return "Rp " + value.toLocaleString("id-ID");
}

function statusLabel(status: Subscription["status"]) {
  const labels: Record<Subscription["status"], string> = {
    active: "Active",
    pending: "Pending",
    expired: "Expired",
    cancelled: "Cancelled",
  };
  return labels[status];
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { currentUser } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<SubscriptionPackage | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const plansResponse = await subscriptionService.plans();
      if (!mounted) return;

      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data.map((plan) => ({ ...plan, ...planDetails[plan.paket] })));
      } else {
        setError(plansResponse.message);
      }

      if (currentUser) {
        const subscriptionResponse = await subscriptionService.current(currentUser.userId);
        if (subscriptionResponse.success && subscriptionResponse.data) setCurrentSubscription(subscriptionResponse.data);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  async function handleSelectPackage(paket: SubscriptionPackage, price: number) {
    if (!currentUser) {
      setError("Session tidak ditemukan. Silakan login atau registrasi ulang.");
      return;
    }

    setSelecting(paket);
    setError("");
    setSuccess("");

    const subscriptionResponse = await subscriptionService.selectPackage(currentUser.userId, paket);
    if (!subscriptionResponse.success || !subscriptionResponse.data) {
      setError(subscriptionResponse.message);
      setSelecting(null);
      return;
    }

    const paymentResponse = await paymentService.create({
      subscriptionId: subscriptionResponse.data.subscriptionId,
      jumlah: price,
      metode: paket === "Free" ? "Free Package" : "Midtrans Mock",
      status: paket === "Free" ? "success" : "pending",
    });

    if (!paymentResponse.success) {
      setError(paymentResponse.message);
      setSelecting(null);
      return;
    }

    if (paket === "Free") {
      await subscriptionService.activate(subscriptionResponse.data.subscriptionId);
    }

    await auditLogService.create({
      userId: currentUser.userId,
      aksi: `Memilih paket ${paket}`,
      module: "subscriptions",
    });

    await notificationService.create({
      userId: currentUser.userId,
      tipe: paket === "Free" ? "activation" : "system",
      pesan: paket === "Free"
        ? "Paket Free aktif. Anda dapat melanjutkan onboarding POSmart."
        : `Payment paket ${paket} masih pending dalam mode mock.`,
      status: paket === "Free" ? "sent" : "pending",
    });

    setCurrentSubscription(subscriptionResponse.data);
    setSuccess("Paket dipilih dan payment record mock dibuat. Mengarahkan ke status pembayaran...");
    setTimeout(() => router.push("/payments"), 700);
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subscription</h1>
          <p className="mt-0.5 text-sm text-gray-500">Pilih paket POSmart untuk mengaktifkan akun dan melanjutkan onboarding</p>
        </div>
        {currentSubscription && (
          <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Paket saat ini</p>
            <p className="mt-1 font-bold text-gray-900">
              {currentSubscription.paket} - {statusLabel(currentSubscription.status)}
            </p>
            {currentSubscription.endDate && <p className="mt-0.5 text-xs text-gray-400">Aktif sampai {currentSubscription.endDate}</p>}
          </div>
        )}
      </div>

      {success && (
        <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-start gap-3 rounded-[20px] border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <Info size={17} className="mt-0.5 flex-shrink-0" />
        <p>Midtrans belum diintegrasikan. Basic dan Pro membuat payment record berstatus pending dalam mode mock, lalu dapat disimulasikan sukses di halaman Payments.</p>
      </div>

      {loading ? (
        <LoadingState title="Memuat paket..." />
      ) : plans.length === 0 ? (
        <EmptyState title="Belum ada paket" description="Data paket subscription belum tersedia di mock service." />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.paket === plan.paket;
            return (
              <div
                key={plan.paket}
                className={`relative flex flex-col rounded-[20px] border-2 bg-white p-6 shadow-sm ${
                  plan.recommended ? "border-[#FF6B00] shadow-orange-100" : "border-gray-100"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#FF6B00] px-4 py-1 text-[11px] font-bold text-white shadow-sm">
                      Rekomendasi UMKM
                    </span>
                  </div>
                )}

                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{plan.paket}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">{formatRp(plan.price)}</span>
                  {plan.price > 0 && <span className="text-sm text-gray-400">/bulan</span>}
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.desc}</p>

                <div className="my-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check size={14} strokeWidth={3} className="mt-0.5 flex-shrink-0 text-green-500" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPackage(plan.paket, plan.price)}
                  disabled={selecting !== null}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors ${
                    isCurrent
                      ? "bg-orange-100 text-orange-500"
                      : plan.recommended
                        ? "bg-[#FF6B00] text-white hover:bg-[#E05E00]"
                        : "border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {isCurrent ? <Star size={14} /> : plan.price === 0 ? <Zap size={14} /> : <CreditCard size={14} />}
                  {selecting === plan.paket ? "Menyimpan..." : isCurrent ? "Pilih Ulang Paket" : "Pilih Paket"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && error && plans.length === 0 && <ErrorState title="Gagal memuat paket" description={error} />}
    </DashboardLayout>
  );
}
