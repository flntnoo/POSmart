import "./load-env";
import { ApiError } from "../src/lib/api-response";
import { toSessionUser, type SessionUser } from "../src/lib/auth";
import { canManageSubscription, canReadAnalytics, canReadNotifications, canReadSystemLogs, canReadSubscription } from "../src/lib/rbac-server";
import { prisma } from "../src/lib/db";
import {
  adjustInventory,
  analyticsOutletPerformance,
  analyticsSummary,
  createCategory,
  createCustomer,
  createInventory,
  createNotification,
  createOutlet,
  createProduct,
  createSubscription,
  createSupplier,
  createTransaction,
  getProduct,
  loginUser,
  updatePaymentStatus,
  registerUser,
} from "../src/server/services/posmart";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectApiError(status: number, action: () => Promise<unknown>, label: string) {
  try {
    await action();
  } catch (error) {
    assert(error instanceof ApiError, `${label}: expected ApiError`);
    assert(error.status === status, `${label}: expected status ${status}, received ${error.status}`);
    return;
  }
  throw new Error(`${label}: expected error status ${status}`);
}

function expectForbidden(action: () => void, label: string) {
  try {
    action();
  } catch (error) {
    assert(error instanceof ApiError, `${label}: expected ApiError`);
    assert(error.status === 403, `${label}: expected 403, received ${error.status}`);
    return;
  }
  throw new Error(`${label}: expected 403`);
}

async function createKasir(owner: SessionUser, stamp: string) {
  const user = await prisma.user.create({
    data: {
      nama: `Phase B Kasir ${stamp}`,
      email: `phase-b-kasir-${stamp}@example.test`,
      passwordHash: "smoke-script-not-for-login",
      role: "kasir",
      ownerUserId: owner.ownerUserId,
    },
  });
  return toSessionUser(user);
}

async function main() {
  const stamp = `${Date.now()}`;
  const password = "password123";
  const email = `phase-b-owner-${stamp}@example.test`;

  const registered = await registerUser({ nama: `Phase B Owner ${stamp}`, email, password, role: "owner" });
  const owner = registered.sessionUser;
  const loggedIn = await loginUser({ email, password });
  assert(loggedIn.sessionUser.userId === owner.userId, "owner login should return the registered owner");

  const outlet = await createOutlet(owner, { nama: `Phase B Outlet ${stamp}`, alamat: "Smoke Test" });
  const category = await createCategory(owner, { nama: `Phase B Category ${stamp}` });
  const supplier = await createSupplier(owner, { nama: `Phase B Supplier ${stamp}`, kontak: "0800-0000" });
  const product = await createProduct(owner, {
    outletId: outlet.outletId,
    categoryId: category.categoryId,
    supplierId: supplier.supplierId,
    nama: `Phase B Product ${stamp}`,
    harga: 10000,
    sku: `PHASE-B-${stamp}`,
  });
  await createInventory(owner, { productId: product.productId, outletId: outlet.outletId, stok: 8, minStock: 5 });
  const adjusted = await adjustInventory(owner, { productId: product.productId, outletId: outlet.outletId, type: "in", quantity: 2 });
  assert(adjusted.stok === 10, "adjust inventory should increase stock to 10");

  const customer = await createCustomer(owner, { nama: `Phase B Customer ${stamp}`, email: `phase-b-customer-${stamp}@example.test` });
  const transaction = await createTransaction(owner, {
    outletId: outlet.outletId,
    customerId: customer.customerId,
    metode: "Tunai",
    items: [
      { productId: product.productId, quantity: 2 },
      { productId: product.productId, quantity: 3 },
    ],
  });
  assert(transaction.total === 50000, "duplicate product lines should combine into total quantity 5");

  const afterTransaction = await prisma.inventory.findUniqueOrThrow({
    where: { productId_outletId: { productId: Number(product.productId), outletId: Number(outlet.outletId) } },
  });
  assert(afterTransaction.stok === 5, "stock should be reduced from 10 to 5");

  await expectApiError(400, () => createTransaction(owner, {
    outletId: outlet.outletId,
    metode: "Tunai",
    items: [{ productId: product.productId, quantity: 99 }],
  }), "insufficient stock should be rejected");

  const afterRejected = await prisma.inventory.findUniqueOrThrow({
    where: { productId_outletId: { productId: Number(product.productId), outletId: Number(outlet.outletId) } },
  });
  assert(afterRejected.stok === 5, "rejected checkout should leave stock unchanged");

  const subscription = await createSubscription(owner, { paket: "Basic" });
  const pendingPayment = await prisma.payment.findFirst({
    where: { subscriptionId: Number(subscription.subscriptionId), status: "pending" },
    orderBy: { paymentId: "desc" },
  });
  assert(pendingPayment, "Basic subscription should create pending payment");
  await updatePaymentStatus(owner, pendingPayment.paymentId, "success");
  const activeSubscription = await prisma.subscription.findUniqueOrThrow({ where: { subscriptionId: Number(subscription.subscriptionId) } });
  assert(activeSubscription.status === "active", "payment success should activate subscription");

  const auditCount = await prisma.auditLog.count({ where: { userId: owner.userId } });
  const notificationCount = await prisma.notificationLog.count({ where: { userId: owner.ownerUserId } });
  assert(auditCount > 0, "audit logs should exist");
  assert(notificationCount > 0, "notification logs should exist");

  const kasir = await createKasir(owner, stamp);
  expectForbidden(() => canReadAnalytics(kasir), "kasir analytics RBAC");
  expectForbidden(() => canReadSubscription(kasir), "kasir subscription RBAC");
  expectForbidden(() => canManageSubscription(kasir), "kasir subscription management RBAC");
  expectForbidden(() => canReadNotifications(kasir), "kasir notification RBAC");
  expectForbidden(() => canReadSystemLogs(kasir), "kasir audit RBAC");

  const otherOwner = (await registerUser({
    nama: `Other Owner ${stamp}`,
    email: `phase-b-other-owner-${stamp}@example.test`,
    password,
    role: "owner",
  })).sessionUser;
  await expectApiError(404, () => getProduct(otherOwner, Number(product.productId)), "owner data isolation");
  await expectApiError(403, () => createNotification(otherOwner, { userId: String(owner.userId), pesan: "Should be forbidden" }), "manual notification target isolation");

  const summary = await analyticsSummary(owner, new URLSearchParams({ outletId: outlet.outletId }));
  assert(summary.jumlahTransaksi >= 1, "analytics summary should use real transactions");
  const outletPerformance = await analyticsOutletPerformance(owner, new URLSearchParams({ outletId: outlet.outletId }));
  assert(outletPerformance.length === 1 && outletPerformance[0].transactionCount >= 1, "outlet performance should be grouped by outlet");

  console.log("Backend Phase B smoke checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
