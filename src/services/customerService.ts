import { belongsToWorkspaceOutlet, getWorkspaceOwnerId, mockCustomerOwners, mockCustomers, mockTransactions } from "@/data/mockData";
import type { Customer } from "@/types/posmart";
import { fail, ok } from "./api";

export const customerService = {
  async list(filters?: { userId?: string }) {
    const ownerId = getWorkspaceOwnerId(filters?.userId);
    const customerIdsFromTransactions = new Set(
      mockTransactions
        .filter((transaction) => !filters?.userId || belongsToWorkspaceOutlet(transaction.outletId, filters.userId))
        .map((transaction) => transaction.customerId)
        .filter((customerId): customerId is string => Boolean(customerId)),
    );
    const customers = ownerId
      ? mockCustomers.filter((customer) => customer.nama === "Walk-in Customer" || mockCustomerOwners[customer.customerId] === ownerId || customerIdsFromTransactions.has(customer.customerId))
      : mockCustomers;
    return ok("Daftar pelanggan berhasil diambil", customers);
  },

  async create(input: Omit<Customer, "customerId"> & { userId?: string }) {
    if (!input.nama) return fail<Customer>("Validasi gagal", { nama: "Nama pelanggan wajib diisi" });
    const { userId, ...customerInput } = input;
    const customer = { customerId: `customer-${Date.now()}`, ...customerInput };
    mockCustomers.unshift(customer);
    const ownerId = getWorkspaceOwnerId(userId);
    if (ownerId) mockCustomerOwners[customer.customerId] = ownerId;
    return ok("Pelanggan berhasil dibuat", customer);
  },

  async update(customerId: string, input: Partial<Omit<Customer, "customerId">>) {
    const customer = mockCustomers.find((item) => item.customerId === customerId);
    if (!customer) return fail<Customer>("Pelanggan tidak ditemukan");
    Object.assign(customer, input);
    return ok("Pelanggan berhasil diperbarui", customer);
  },

  async remove(customerId: string) {
    return ok("Pelanggan siap dihapus pada backend", { customerId });
  },
};
