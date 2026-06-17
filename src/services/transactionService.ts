import type { Transaction, TransactionDetail } from "@/types/posmart";
import { apiRequest, jsonBody, queryString } from "./api";

export type CreateTransactionInput = Omit<Transaction, "transactionId" | "tanggal" | "total"> & {
  items: Array<Pick<TransactionDetail, "productId" | "quantity" | "subtotal">>;
};

export const transactionService = {
  list(filters?: { outletId?: string; customerId?: string; userId?: string }) {
    return apiRequest<Transaction[]>(`/api/transactions${queryString(filters)}`);
  },

  detail(transactionId: string) {
    return apiRequest<{ transaction: Transaction; details: TransactionDetail[] }>(`/api/transactions/${transactionId}`);
  },

  create(input: CreateTransactionInput) {
    const { items, ...rest } = input;
    return apiRequest<Transaction>("/api/transactions", {
      method: "POST",
      body: jsonBody({
        ...rest,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }),
    });
  },
};
