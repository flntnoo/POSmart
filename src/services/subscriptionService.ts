import { mockSubscriptions } from "@/data/mockData";
import type { Subscription, SubscriptionPackage } from "@/types/posmart";
import { fail, ok } from "./api";

export const subscriptionService = {
  async list() {
    return ok("Daftar subscription berhasil diambil", mockSubscriptions);
  },

  async plans() {
    return ok("Daftar paket berhasil diambil", [
      { paket: "Free" as SubscriptionPackage, price: 0 },
      { paket: "Basic" as SubscriptionPackage, price: 299000 },
      { paket: "Pro" as SubscriptionPackage, price: 599000 },
    ]);
  },

  async current(userId: string) {
    const subscription = mockSubscriptions.find((item) => item.userId === userId);
    return subscription ? ok("Subscription berhasil diambil", subscription) : fail<Subscription>("Subscription tidak ditemukan");
  },

  async selectPackage(userId: string, paket: SubscriptionPackage) {
    const existingIndex = mockSubscriptions.findIndex((item) => item.userId === userId);
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);
    const subscription: Subscription = {
      subscriptionId: `sub-${Date.now()}`,
      userId,
      paket,
      status: paket === "Free" ? "active" : "pending",
      startDate: now.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    };
    if (existingIndex >= 0) mockSubscriptions[existingIndex] = subscription;
    else mockSubscriptions.unshift(subscription);
    return ok("Paket subscription berhasil dipilih", subscription);
  },

  async activate(subscriptionId: string) {
    const subscription = mockSubscriptions.find((item) => item.subscriptionId === subscriptionId);
    if (!subscription) return fail<Subscription>("Subscription tidak ditemukan");
    subscription.status = "active";
    if (!subscription.startDate) subscription.startDate = new Date().toISOString().slice(0, 10);
    return ok("Subscription berhasil diaktifkan", subscription);
  },
};
