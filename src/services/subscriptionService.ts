import type { Subscription, SubscriptionPackage } from "@/types/posmart";
import { apiListRequest, apiRequest, jsonBody } from "./api";

export const subscriptionService = {
  list() {
    return apiListRequest<Subscription>("/api/subscriptions");
  },

  plans() {
    return apiRequest<Array<{ paket: SubscriptionPackage; price: number }>>("/api/subscriptions/plans");
  },

  current(userId: string) {
    void userId;
    return apiRequest<Subscription>("/api/subscriptions/current");
  },

  selectPackage(userId: string, paket: SubscriptionPackage) {
    void userId;
    return apiRequest<Subscription>("/api/subscriptions", {
      method: "POST",
      body: jsonBody({ paket }),
    });
  },

  activate(subscriptionId: string) {
    void subscriptionId;
    return apiRequest<Subscription>("/api/subscriptions/current");
  },
};
