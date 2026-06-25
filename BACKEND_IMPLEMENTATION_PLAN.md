# POSmart Backend Implementation Plan

## 1. Objective

Implement a real backend for POSmart that replaces the current frontend mock service layer with:

- Next.js App Router API endpoints.
- PostgreSQL persistence through Prisma.
- Cookie-based authentication.
- Role-based access control for `owner`, `admin`, and `kasir`.
- Outlet-scoped business ownership.
- Atomic POS transaction creation with stock reduction.
- Audit logs, notification logs, payment simulation, subscription records, and analytics.

All endpoints must preserve the existing frontend response shape:

```ts
{
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}
```

## 2. Current Implementation Status

Backend foundation has been implemented.

Completed:

- Prisma schema added at `prisma/schema.prisma`.
- Seed script added at `prisma/seed.ts`.
- Environment template added at `.env.example`.
- Shared backend helpers added:
  - `src/lib/db.ts`
  - `src/lib/auth.ts`
  - `src/lib/api-response.ts`
  - `src/lib/rbac-server.ts`
- DTO, validator, and service layers added under `src/server`.
- API route handlers added under `src/app/api`.
- Backend dependencies added to `package.json`.
- Project standardized on npm with `package-lock.json`.
- pnpm files removed.
- Prisma 7 PostgreSQL adapter configured through `@prisma/adapter-pg`.
- Frontend service modules replaced with `/api/*` fetch calls.
- Session context hydrates from the backend session endpoint.
- Login page uses backend authentication.
- POS checkout now calls only `POST /api/transactions`; stock, audit logs, and low-stock notifications are handled by backend logic.
- Payment success simulation now goes through the backend payment status endpoint.

Verified:

```bash
npm run prisma:validate
npm run prisma:generate
npm exec -- tsc --noEmit --pretty false
npm run lint
npm run build
```

Known local setup note:

- Production build may need network access the first time Next.js fetches Google Fonts through `next/font`.

## 3. Implemented Backend Stack

- Framework: Next.js `16.2.9` App Router route handlers.
- Database: PostgreSQL.
- ORM: Prisma.
- Validation: Zod.
- Password hashing: `bcryptjs`.
- Session strategy: signed HTTP-only cookie through `src/lib/auth.ts`.
- Auth.js / NextAuth scaffold: `src/app/api/auth/[...nextauth]/route.ts`, reserved for future OAuth integration.
- Package manager: npm.

## 4. Database Plan

The Prisma schema maps the original SQL concept into MVP-ready entities:

- `users`
- `outlets`
- `categories`
- `suppliers`
- `products`
- `inventory`
- `customers`
- `transactions`
- `transaction_details`
- `subscriptions`
- `payments`
- `notification_logs`
- `audit_logs`

Important schema decisions:

- Internal IDs are integer primary keys.
- API DTOs convert IDs to strings to match `src/types/posmart.ts`.
- `owner_user_id` scopes admin/kasir users to an owner workspace.
- `outlets` are the main MVP business scope.
- `categories`, `suppliers`, and `customers` include owner scoping.
- `inventory` includes `min_stock`.
- `transactions` include payment method and status.
- `transaction_details` include `unit_price` for historical accuracy.
- `payments` include status, provider, and optional external reference.
- `notification_logs` include type, status, and dedupe key.
- `audit_logs` include module and optional entity metadata.

## 5. npm Commands

Use npm only.

Install dependencies:

```bash
npm install
```

Validate Prisma schema:

```bash
npm run prisma:validate
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Create local migration:

```bash
npm run prisma:migrate
```

Seed local database:

```bash
npm run prisma:seed
```

Run development server:

```bash
npm run dev
```

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

Local machine note:

- If the global `npm` shim is broken on Windows, run npm through:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" <command>
```

## 6. Environment Setup

Create `.env` from `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/posmart"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
APP_BASE_URL="http://localhost:3000"
```

Future integration variables are already documented in `.env.example`:

- Google OAuth
- Midtrans
- WhatsApp Business API
- Cloudinary

## 7. Implemented API Modules

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET/PATCH /api/users/me`

Master data:

- `GET/POST /api/outlets`
- `GET/PATCH/DELETE /api/outlets/[id]`
- `GET/POST /api/categories`
- `GET/PATCH/DELETE /api/categories/[id]`
- `GET/POST /api/suppliers`
- `GET/PATCH/DELETE /api/suppliers/[id]`
- `GET/POST /api/products`
- `GET/PATCH/DELETE /api/products/[id]`
- `GET/POST /api/customers`
- `GET/PATCH/DELETE /api/customers/[id]`

Inventory:

- `GET/POST /api/inventory`
- `PATCH /api/inventory/[id]`
- `POST /api/inventory/adjust`
- `GET /api/inventory/low-stock`

Transactions:

- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/[id]`

Subscription and payment:

- `GET /api/subscriptions/plans`
- `GET /api/subscriptions/current`
- `GET/POST /api/subscriptions`
- `GET/POST /api/payments`
- `PATCH /api/payments/[id]/status`

Notifications, audit, analytics:

- `GET/POST /api/notifications`
- `GET/POST /api/audit-logs`
- `GET /api/audit-logs/[id]`
- `GET /api/analytics/summary`
- `GET /api/analytics/revenue-trend`
- `GET /api/analytics/top-products`
- `GET /api/analytics/outlet-performance`

## 8. Backend Smoke Test Plan

After local PostgreSQL is configured:

1. Run migration and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

2. Start the app:

```bash
npm run dev
```

3. Test the core backend flow:

- Register or login.
- Confirm session with `GET /api/auth/session`.
- Create outlet.
- Create category.
- Create supplier.
- Create product.
- Create inventory row.
- Create POS transaction.
- Confirm inventory stock decreases.
- Confirm transaction detail exists.
- Confirm audit log exists.
- Confirm low-stock notification is created when stock reaches `min_stock`.
- Confirm analytics summary updates.

The most important smoke test is:

```text
login -> create product -> create inventory -> create transaction -> stock decreases
```

## 9. Next Implementation Phase

### Phase A: Backend Stabilization

Goal:

- Prove the backend works against a real PostgreSQL database.

Tasks:

- Create `.env`.
- Run migration.
- Run seed.
- Smoke-test auth and core CRUD.
- Smoke-test POS transaction atomicity.
- Confirm no route returns raw Prisma errors.

Acceptance criteria:

- `npm run prisma:validate` passes.
- `npm run prisma:generate` passes.
- Migration runs against local PostgreSQL.
- Seed runs successfully.
- POS transaction reduces inventory in one atomic operation.
- Failed transaction due to insufficient stock does not create partial records.

Status:

- Code-level validation is complete.
- Real database migration, seed, and API smoke testing still require a configured local PostgreSQL database.

### Phase B: Frontend Type and Lint Cleanup

Goal:

- Unblock full project validation before wiring frontend to backend.

Tasks:

- Fix optional `response.data` type narrowing in customer, supplier, and onboarding pages.
- Fix React hook lint issues in onboarding and payments pages.
- Re-run:

```bash
npm run lint
npm run build
```

Acceptance criteria:

- Lint passes.
- Build passes.

Status:

- Complete.

### Phase C: Frontend API Integration

Goal:

- Replace mock services with real `/api/*` calls without changing page behavior.

Recommended order:

1. Replace `src/services/api.ts` with shared fetch helpers.
2. Replace `authService`.
3. Hydrate `SessionContext` from `/api/auth/session`.
4. Replace subscription and payment services.
5. Replace master data services.
6. Replace inventory service.
7. Replace transaction service.
8. Update POS checkout to call only `POST /api/transactions`.
9. Replace analytics, notification, and audit services.

Acceptance criteria:

- Frontend no longer imports `mockData` from service modules.
- Login/register/session use backend.
- POS checkout is one backend call.
- Inventory stock changes only on the backend.
- Audit and notification logs are generated by backend services.

Status:

- Complete for MVP service modules and key flows.

### Phase D: Backend Tests

Goal:

- Add automated coverage for the highest-risk backend behavior.

Test priorities:

- Auth validation.
- RBAC restrictions.
- Ownership scoping.
- Product/inventory CRUD.
- Inventory negative-stock prevention.
- POS transaction rollback on insufficient stock.
- POS transaction stock reduction on success.
- Payment success activates subscription.
- Analytics counts only successful transactions.

Recommended tooling:

- Vitest for service-level tests.
- A dedicated test database.
- Route-handler integration tests after service tests are stable.

## 10. Future Integrations

Do not implement these until the MVP backend and frontend integration are stable:

- Google OAuth through Auth.js provider.
- Midtrans payment creation and webhook verification.
- WhatsApp Business API notification delivery.
- Cloudinary product image upload.
- Team/outlet-specific staff permissions beyond owner workspace scope.
- Transaction cancellation/restock flow.

## 11. Definition of Done for Backend MVP

Backend MVP is complete when:

- PostgreSQL migration and seed work from a clean database.
- All MVP API routes return the standard `ApiResponse<T>` shape.
- Auth/session works through secure cookies.
- RBAC blocks restricted actions with 403.
- Users cannot access another owner workspace.
- Master data CRUD works.
- Inventory cannot become negative.
- POS transaction creation is atomic.
- Payments can be simulated.
- Subscription activation works.
- Notification logs and audit logs are created by backend logic.
- Analytics reads real transaction data.
- Frontend can complete the flow:

```text
register -> subscription -> payment -> onboarding -> dashboard -> POS transaction -> analytics
```
