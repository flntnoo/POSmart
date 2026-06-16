-- =====================================================================
--  POSmart Technologies Indonesia
--  Skema Database (Target / To-Be Data Architecture)
--  Target DBMS : PostgreSQL 14+
--  Encoding    : UTF-8
--
--  Cara pakai:
--    1. Buat database  : CREATE DATABASE posmart;
--    2. Hubungkan      : \c posmart
--    3. Jalankan file  : \i posmart_schema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- (Opsional) Bersihkan dulu jika ingin instal ulang dari nol.
-- Urutan DROP dibalik dari urutan CREATE agar tidak melanggar FK.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS audit_logs           CASCADE;
DROP TABLE IF EXISTS notification_logs     CASCADE;
DROP TABLE IF EXISTS payments              CASCADE;
DROP TABLE IF EXISTS subscriptions         CASCADE;
DROP TABLE IF EXISTS transaction_details   CASCADE;
DROP TABLE IF EXISTS transactions          CASCADE;
DROP TABLE IF EXISTS customers             CASCADE;
DROP TABLE IF EXISTS inventory             CASCADE;
DROP TABLE IF EXISTS products              CASCADE;
DROP TABLE IF EXISTS suppliers             CASCADE;
DROP TABLE IF EXISTS categories            CASCADE;
DROP TABLE IF EXISTS outlets               CASCADE;
DROP TABLE IF EXISTS users                 CASCADE;

-- =====================================================================
--  1. USERS
--  Catatan: nama tabel "users" (jamak) dipakai karena "user" adalah
--  kata kunci yang dipesan (reserved word) di PostgreSQL.
-- =====================================================================
CREATE TABLE users (
    user_id       SERIAL        PRIMARY KEY,
    nama          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,          -- tambahan praktis (login)
    password_hash VARCHAR(255)  NOT NULL,                 -- tambahan praktis (login)
    role          VARCHAR(30)   NOT NULL DEFAULT 'kasir', -- owner | admin | kasir
    created_at    TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT now()
);

-- =====================================================================
--  2. OUTLETS  (cabang / lokasi usaha yang dikelola seorang user)
--  Relasi: USER 1 --- N OUTLET
-- =====================================================================
CREATE TABLE outlets (
    outlet_id   SERIAL       PRIMARY KEY,
    user_id     INTEGER      NOT NULL,
    nama        VARCHAR(120) NOT NULL,
    alamat      TEXT,                                   -- opsional
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT fk_outlet_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================================================
--  3. CATEGORIES
-- =====================================================================
CREATE TABLE categories (
    category_id SERIAL      PRIMARY KEY,
    nama        VARCHAR(80) NOT NULL
);

-- =====================================================================
--  4. SUPPLIERS
-- =====================================================================
CREATE TABLE suppliers (
    supplier_id SERIAL       PRIMARY KEY,
    nama        VARCHAR(120) NOT NULL,
    kontak      VARCHAR(100)                            -- opsional (telp/email)
);

-- =====================================================================
--  5. PRODUCTS
--  Relasi: CATEGORY 1 --- N PRODUCT ; SUPPLIER 1 --- N PRODUCT ;
--          OUTLET   1 --- N PRODUCT
--  Catatan desain: outlet_id dipertahankan agar sesuai ERD To-Be.
--  Lihat "Catatan Desain" pada PRD bila ingin katalog produk lintas-outlet.
-- =====================================================================
CREATE TABLE products (
    product_id  SERIAL         PRIMARY KEY,
    category_id INTEGER,
    supplier_id INTEGER,
    outlet_id   INTEGER,
    nama        VARCHAR(120)   NOT NULL,
    harga       NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (harga >= 0),
    created_at  TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_product_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_product_outlet
        FOREIGN KEY (outlet_id) REFERENCES outlets(outlet_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- =====================================================================
--  6. INVENTORY  (stok produk per outlet)
--  Relasi: PRODUCT 1 --- N INVENTORY ; OUTLET 1 --- N INVENTORY
--  UNIQUE(product_id, outlet_id): 1 baris stok per produk per outlet.
-- =====================================================================
CREATE TABLE inventory (
    inventory_id SERIAL    PRIMARY KEY,
    product_id   INTEGER   NOT NULL,
    outlet_id    INTEGER   NOT NULL,
    stok         INTEGER   NOT NULL DEFAULT 0 CHECK (stok >= 0),
    updated_at   TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_inventory_outlet
        FOREIGN KEY (outlet_id) REFERENCES outlets(outlet_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_inventory_product_outlet
        UNIQUE (product_id, outlet_id)
);

-- =====================================================================
--  7. CUSTOMERS
-- =====================================================================
CREATE TABLE customers (
    customer_id SERIAL       PRIMARY KEY,
    nama        VARCHAR(120) NOT NULL,
    telepon     VARCHAR(30),                            -- opsional
    email       VARCHAR(150)                            -- opsional
);

-- =====================================================================
--  8. TRANSACTIONS
--  Relasi: CUSTOMER 1 --- N TRANSACTION ; USER 1 --- N TRANSACTION ;
--          OUTLET   1 --- N TRANSACTION
--  customer_id NULL diperbolehkan untuk transaksi tanpa pelanggan (walk-in).
-- =====================================================================
CREATE TABLE transactions (
    transaction_id SERIAL        PRIMARY KEY,
    customer_id    INTEGER,                             -- nullable (walk-in)
    user_id        INTEGER       NOT NULL,              -- kasir yang memproses
    outlet_id      INTEGER,                             -- tambahan disarankan
    tanggal        TIMESTAMP     NOT NULL DEFAULT now(),
    total          NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    CONSTRAINT fk_transaction_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_transaction_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_transaction_outlet
        FOREIGN KEY (outlet_id) REFERENCES outlets(outlet_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- =====================================================================
--  9. TRANSACTION_DETAILS
--  Relasi: TRANSACTION 1 --- N TRANSACTION_DETAIL ;
--          PRODUCT     1 --- N TRANSACTION_DETAIL
--  Detail ikut terhapus bila transaksinya dihapus (ON DELETE CASCADE).
-- =====================================================================
CREATE TABLE transaction_details (
    detail_id      SERIAL        PRIMARY KEY,
    transaction_id INTEGER       NOT NULL,
    product_id     INTEGER       NOT NULL,
    quantity       INTEGER       NOT NULL CHECK (quantity > 0),
    subtotal       NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_detail_transaction
        FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_detail_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================================================
-- 10. SUBSCRIPTIONS  (paket langganan POSmart milik user/usaha)
--  Relasi: USER 1 --- N SUBSCRIPTION
-- =====================================================================
CREATE TABLE subscriptions (
    subscription_id SERIAL      PRIMARY KEY,
    user_id         INTEGER     NOT NULL,
    paket           VARCHAR(50) NOT NULL,               -- Free | Basic | Pro
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active | expired | cancelled
    start_date      DATE,
    end_date        DATE,
    CONSTRAINT fk_subscription_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =====================================================================
-- 11. PAYMENTS  (pembayaran atas suatu langganan)
--  Relasi: SUBSCRIPTION 1 --- N PAYMENT
-- =====================================================================
CREATE TABLE payments (
    payment_id      SERIAL        PRIMARY KEY,
    subscription_id INTEGER       NOT NULL,
    jumlah          NUMERIC(12,2) NOT NULL CHECK (jumlah >= 0),
    metode          VARCHAR(40),                        -- transfer | ewallet | kartu
    payment_date    TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT fk_payment_subscription
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =====================================================================
-- 12. NOTIFICATION_LOGS  (riwayat notifikasi ke user)
--  Relasi: USER 1 --- N NOTIFICATION_LOG
-- =====================================================================
CREATE TABLE notification_logs (
    notif_id   SERIAL    PRIMARY KEY,
    user_id    INTEGER   NOT NULL,
    pesan      TEXT,                                    -- isi notifikasi
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_notif_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =====================================================================
-- 13. AUDIT_LOGS  (riwayat aktivitas user dalam sistem)
--  Relasi: USER 1 --- N AUDIT_LOG
-- =====================================================================
CREATE TABLE audit_logs (
    audit_id   SERIAL    PRIMARY KEY,
    user_id    INTEGER   NOT NULL,
    aksi       VARCHAR(255),                            -- deskripsi aktivitas
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =====================================================================
--  INDEKS PENDUKUNG (mempercepat join & filter pada kolom FK)
-- =====================================================================
CREATE INDEX idx_outlets_user            ON outlets(user_id);
CREATE INDEX idx_products_category       ON products(category_id);
CREATE INDEX idx_products_supplier       ON products(supplier_id);
CREATE INDEX idx_products_outlet         ON products(outlet_id);
CREATE INDEX idx_inventory_product       ON inventory(product_id);
CREATE INDEX idx_inventory_outlet        ON inventory(outlet_id);
CREATE INDEX idx_transactions_customer   ON transactions(customer_id);
CREATE INDEX idx_transactions_user       ON transactions(user_id);
CREATE INDEX idx_transactions_outlet     ON transactions(outlet_id);
CREATE INDEX idx_transactions_tanggal    ON transactions(tanggal);
CREATE INDEX idx_details_transaction     ON transaction_details(transaction_id);
CREATE INDEX idx_details_product         ON transaction_details(product_id);
CREATE INDEX idx_subscriptions_user      ON subscriptions(user_id);
CREATE INDEX idx_payments_subscription   ON payments(subscription_id);
CREATE INDEX idx_notiflogs_user          ON notification_logs(user_id);
CREATE INDEX idx_auditlogs_user          ON audit_logs(user_id);

-- =====================================================================
--  CONTOH DATA (opsional) — hapus tanda komentar untuk mengisi sampel.
-- =====================================================================
-- INSERT INTO users (nama, email, password_hash, role)
--   VALUES ('Budi Santoso', 'budi@umkm.id', 'hash_dummy', 'owner');
-- INSERT INTO outlets (user_id, nama, alamat)
--   VALUES (1, 'Toko Budi Pusat', 'Jl. Merdeka No. 1, Jakarta');
-- INSERT INTO categories (nama) VALUES ('Makanan'), ('Minuman');
-- INSERT INTO suppliers (nama, kontak) VALUES ('CV Sumber Pangan', '0812000111');
-- INSERT INTO products (category_id, supplier_id, outlet_id, nama, harga)
--   VALUES (1, 1, 1, 'Roti Tawar', 15000);
-- INSERT INTO inventory (product_id, outlet_id, stok) VALUES (1, 1, 100);

-- =====================================================================
--  SELESAI
-- =====================================================================
