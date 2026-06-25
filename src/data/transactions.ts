import type {
  Customer as DomainCustomer,
  Product,
  Transaction as DomainTransaction,
  TransactionDetail,
  User,
} from "@/types/posmart";

export type TransactionStatus = "Sukses" | "Pending" | "Batal";
export type PaymentMethod = "Tunai" | "Transfer" | "QRIS" | "Kartu";

export type TransactionItem = {
  name: string;
  qty: number;
  price: number;
};

export type Transaction = {
  id: string;
  date: string;
  customer: string;
  cashier: string;
  itemCount: number;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  method: PaymentMethod;
  status: TransactionStatus;
};

function formatDate(value: string) {
  const date = new Date(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function toTransactionView(
  transaction: DomainTransaction,
  options: {
    details: TransactionDetail[];
    products: Product[];
    customers: DomainCustomer[];
    users?: User[];
  },
): Transaction {
  const details = options.details.filter((detail) => detail.transactionId === transaction.transactionId);
  const items = details.map((detail) => {
    const product = options.products.find((item) => item.productId === detail.productId);
    return {
      name: product?.nama ?? "Produk tidak tersedia",
      qty: detail.quantity,
      price: detail.quantity > 0 ? detail.subtotal / detail.quantity : 0,
    };
  });
  const subtotal = details.reduce((sum, detail) => sum + detail.subtotal, 0);
  const tax = Math.max(transaction.total - subtotal, 0);
  const customer = options.customers.find((item) => item.customerId === transaction.customerId);
  const cashier = options.users?.find((user) => user.userId === transaction.userId);

  return {
    id: transaction.transactionId,
    date: formatDate(transaction.tanggal),
    customer: customer?.nama ?? "Walk-in Customer",
    cashier: cashier?.nama ?? "Tidak tersedia",
    itemCount: details.length,
    items,
    subtotal,
    tax,
    total: transaction.total,
    method: transaction.metode,
    status: transaction.status,
  };
}

export function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
