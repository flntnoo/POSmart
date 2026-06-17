# Backend Phase A Verification Checklist

This checklist verifies the Phase A backend fixes without resetting or dropping a database. Run it only against a local or staging database that can safely receive new test rows.

## Preconditions

1. Confirm `.env.local` points to the intended non-production database.
2. Apply the existing migration with a non-destructive command:

```bash
npx prisma migrate dev --name init
```

If Prisma asks to reset or drop the database because of schema drift, stop and do not continue. Do not approve a reset/drop as part of Phase A verification.

3. Seed only if the target database is safe for demo data:

```bash
npx prisma db seed
```

4. Start the app:

```bash
npm run dev
```

Use a cookie jar in your API client so login/session cookies are preserved.

Use unique values when rerunning this checklist. For example:

- First run: `phase-a-owner-001@example.test`, `PHASE-A-001`
- Second run: `phase-a-owner-002@example.test`, `PHASE-A-002`

Keep the IDs returned by each response. Do not assume database IDs start at `1`.

## Core Flow

### 1. Register Owner

```http
POST /api/auth/register
Content-Type: application/json

{
  "nama": "Phase A Owner",
  "email": "phase-a-owner-001@example.test",
  "password": "password123",
  "role": "owner"
}
```

Expected: `201`, `success: true`, user data, and an HTTP-only session cookie.

Save the returned `userId` as `ownerUserId`.

### 2. Create Outlet

```http
POST /api/outlets
Content-Type: application/json

{
  "nama": "Phase A Outlet",
  "alamat": "Jl. Phase A"
}
```

Expected: `201`, outlet data.

Save the returned `outletId`.

### 3. Create Category

```http
POST /api/categories
Content-Type: application/json

{
  "nama": "Phase A Category"
}
```

Expected: `201`, category data.

Save the returned `categoryId`.

### 4. Create Product

Use the returned `outletId` from step 2 and `categoryId` from step 3. Use a unique `sku` for each checklist run.

```http
POST /api/products
Content-Type: application/json

{
  "outletId": "{outletId}",
  "categoryId": "{categoryId}",
  "nama": "Phase A Product",
  "harga": 10000,
  "sku": "PHASE-A-001"
}
```

Expected: `201`, product data.

Save the returned `productId`.

### 5. Create Inventory

Use the returned `productId` from step 4 and `outletId` from step 2.

```http
POST /api/inventory
Content-Type: application/json

{
  "productId": "{productId}",
  "outletId": "{outletId}",
  "stok": 10,
  "minStock": 5
}
```

Expected: `201`, inventory data.

Save the returned `inventoryId`.

### 6. Create Transaction With Duplicate Product Lines

Use the returned `outletId` from step 2 and `productId` from step 4.

```http
POST /api/transactions
Content-Type: application/json

{
  "outletId": "{outletId}",
  "metode": "Tunai",
  "items": [
    { "productId": "{productId}", "quantity": 2 },
    { "productId": "{productId}", "quantity": 3 }
  ]
}
```

Expected: `201`, `total` calculated by backend as `harga * 5`. Inventory stock should decrease from `10` to `5`, not `7` or `8`.

### 7. Verify Stock After Duplicate Product Lines

```http
GET /api/inventory
```

Expected: `200`. The inventory row for `{productId}` has `stok: 5`.

This confirms the duplicate line items were combined and stock was reduced by the combined quantity of `5`.

### 8. Reject Insufficient Stock

Use the same returned `outletId` and `productId`.

```http
POST /api/transactions
Content-Type: application/json

{
  "outletId": "{outletId}",
  "metode": "Tunai",
  "items": [
    { "productId": "{productId}", "quantity": 999 }
  ]
}
```

Expected: `400`, `success: false`, no transaction details created, inventory stock unchanged.

### 9. Verify Stock After Insufficient Stock Rejection

```http
GET /api/inventory
```

Expected: `200`. The inventory row for `{productId}` still has `stok: 5`.

This confirms the rejected transaction did not reduce inventory or commit partial transaction data.

### 10. Verify Low-Stock Notification

```http
GET /api/notifications
```

Expected: `200` for owner/admin.

If the backend rule is `stock <= minStock`, a low-stock notification should exist after stock reaches `5`.

If the backend rule is `stock < minStock`, create another valid transaction to reduce stock below `5`, then check notifications again.

### 11. Verify Audit Log

```http
GET /api/audit-logs?module=transactions
```

Expected: `200` for owner/admin. A transaction audit entry exists.

### 12. Verify Payment Simulation

Create a subscription, create a payment, then mark it successful:

```http
POST /api/subscriptions
Content-Type: application/json

{ "paket": "Basic" }
```

Save the returned `subscriptionId`.

```http
POST /api/payments
Content-Type: application/json

{
  "subscriptionId": "{subscriptionId}",
  "jumlah": 299000,
  "metode": "mock"
}
```

Save the returned `paymentId`.

```http
PATCH /api/payments/{paymentId}/status
Content-Type: application/json

{ "status": "success" }
```

Expected: payment status becomes `success`, subscription becomes `active`, and an activation notification is created.

## RBAC Checks

Login as a `kasir` user and verify:

- The kasir must belong to the same owner workspace as the outlet/product/inventory used for POS testing.
- With the current backend model, seeded `kasir@posmart.test` belongs to the seeded owner workspace. If you create a new owner during this checklist and do not have a user/team creation endpoint yet, use an existing seeded kasir plus seeded outlet/product/inventory, or create the kasir directly in the local database only if that is safe for your test environment.
- `GET /api/analytics/summary` returns `403`.
- `GET /api/subscriptions/current` returns `403`.
- `GET /api/notifications` returns `403`.
- `GET /api/audit-logs` returns `403`.
- `POST /api/transactions` still succeeds for valid POS payloads.
- `GET /api/transactions` returns only transactions created by that kasir.

## Ownership Checks

Using two different owner accounts:

- Owner B cannot fetch or mutate Owner A outlets, products, inventory, customers, transactions, subscriptions, payments, notifications, or audit logs.
- Manual notification creation with an unrelated `userId` returns `403`.
- Manual audit log creation with an unrelated `userId` returns `403`.
