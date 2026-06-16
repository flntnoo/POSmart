import {
  mockCategories,
  mockCustomers,
  mockInventory,
  mockProducts,
  mockTransactionDetails,
  mockTransactions,
} from "@/data/mockData";

const successfulTransactions = mockTransactions.filter((transaction) => transaction.status === "Sukses");
const successfulIds = new Set(successfulTransactions.map((transaction) => transaction.transactionId));
const soldDetails = mockTransactionDetails.filter((detail) => successfulIds.has(detail.transactionId));
const totalRevenue = successfulTransactions.reduce((sum, transaction) => sum + transaction.total, 0);

function shortRp(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")} Juta`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} Ribu`;
  return `Rp ${value}`;
}

export const statsData = [
  {
    id: "revenue",
    title: "Pendapatan Bulan Ini",
    value: shortRp(totalRevenue),
    subtitle: `${successfulTransactions.length} transaksi sukses`,
    trend: +12.5,
    icon: "trending-up",
    highlight: true,
  },
  {
    id: "customers",
    title: "Total Pelanggan",
    value: String(mockCustomers.length),
    subtitle: "Data pelanggan aktif",
    trend: +8.1,
    icon: "users",
    highlight: false,
  },
  {
    id: "products",
    title: "Produk Aktif",
    value: String(mockProducts.length),
    subtitle: `${mockInventory.filter((item) => item.stok <= item.minStock).length} stok menipis`,
    trend: -2.3,
    icon: "package",
    highlight: false,
  },
  {
    id: "transactions",
    title: "Transaksi Hari Ini",
    value: String(mockTransactions.filter((transaction) => transaction.tanggal.startsWith("2026-06-13")).length),
    subtitle: shortRp(successfulTransactions.filter((transaction) => transaction.tanggal.startsWith("2026-06-13")).reduce((sum, transaction) => sum + transaction.total, 0)),
    trend: +5.7,
    icon: "shopping-cart",
    highlight: false,
  },
];

export const weeklyActivityData = [
  { day: "Sen", income: 0, expense: 0 },
  { day: "Sel", income: 0, expense: 0 },
  { day: "Rab", income: 0, expense: 0 },
  { day: "Kam", income: 0, expense: 0 },
  { day: "Jum", income: successfulTransactions.find((transaction) => transaction.tanggal.startsWith("2026-06-12"))?.total ?? 0, expense: 120000 },
  { day: "Sab", income: successfulTransactions.filter((transaction) => transaction.tanggal.startsWith("2026-06-13")).reduce((sum, transaction) => sum + transaction.total, 0), expense: 180000 },
  { day: "Min", income: 0, expense: 0 },
];

export const salesTrendData = [
  { month: "Jan", penjualan: 0 },
  { month: "Feb", penjualan: 0 },
  { month: "Mar", penjualan: 0 },
  { month: "Apr", penjualan: 0 },
  { month: "Mei", penjualan: 0 },
  { month: "Jun", penjualan: totalRevenue },
  { month: "Jul", penjualan: 0 },
  { month: "Agu", penjualan: 0 },
  { month: "Sep", penjualan: 0 },
  { month: "Okt", penjualan: 0 },
  { month: "Nov", penjualan: 0 },
  { month: "Des", penjualan: 0 },
];

export const paymentMethodData = ["Tunai", "Transfer", "QRIS", "Kartu"].map((method, index) => ({
  name: method,
  value: successfulTransactions.filter((transaction) => transaction.metode === method).length,
  color: ["#FF6B00", "#3B82F6", "#10B981", "#8B5CF6"][index],
}));

export const categoryData = mockCategories.map((category, index) => {
  const products = mockProducts.filter((product) => product.categoryId === category.categoryId).map((product) => product.productId);
  const sold = soldDetails.filter((detail) => products.includes(detail.productId)).reduce((sum, detail) => sum + detail.quantity, 0);
  return {
    name: category.nama,
    value: sold,
    color: ["#EF4444", "#1D4ED8", "#FDBA74", "#22C55E"][index],
    barColor: ["#FF6B00", "#1D4ED8", "#22C55E", "#F59E0B"][index],
  };
});

export const recentTransactionsData = successfulTransactions.slice(0, 5).map((transaction, index) => ({
  id: transaction.transactionId,
  name: mockCustomers.find((customer) => customer.customerId === transaction.customerId)?.nama ?? "Walk-in Customer",
  date: transaction.tanggal.startsWith("2026-06-13") ? "Hari ini" : "Kemarin",
  amount: transaction.total,
  method: transaction.metode,
  initials: (mockCustomers.find((customer) => customer.customerId === transaction.customerId)?.nama ?? "WC")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2),
  color: ["#FF6B00", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"][index],
}));

export const lowStockData = mockInventory
  .filter((item) => item.stok <= item.minStock)
  .map((item, index) => {
    const product = mockProducts.find((entry) => entry.productId === item.productId);
    return {
      id: index + 1,
      name: product?.nama ?? "Produk tidak dikenal",
      category: mockCategories.find((category) => category.categoryId === product?.categoryId)?.nama ?? "-",
      stock: item.stok,
      maxStock: Math.max(item.minStock * 4, item.stok),
      sku: product?.sku ?? product?.productId ?? "-",
    };
  });

export const topProductsData = [...new Set(soldDetails.map((detail) => detail.productId))]
  .map((productId, index) => {
    const product = mockProducts.find((item) => item.productId === productId);
    const details = soldDetails.filter((detail) => detail.productId === productId);
    return {
      rank: index + 1,
      name: product?.nama ?? "Produk tidak dikenal",
      category: mockCategories.find((category) => category.categoryId === product?.categoryId)?.nama ?? "-",
      sold: details.reduce((sum, detail) => sum + detail.quantity, 0),
      revenue: details.reduce((sum, detail) => sum + detail.subtotal, 0),
      trend: index % 2 === 0 ? 12 : -4,
    };
  })
  .sort((a, b) => b.sold - a.sold);

export const topCustomersData = mockCustomers.slice(0, 4).map((customer, index) => {
  const transactions = successfulTransactions.filter((transaction) => transaction.customerId === customer.customerId);
  return {
    rank: index + 1,
    name: customer.nama,
    totalOrders: transactions.length,
    totalSpent: transactions.reduce((sum, transaction) => sum + transaction.total, 0),
    initials: customer.nama.split(" ").map((part) => part[0]).join("").slice(0, 2),
    color: ["#FF6B00", "#3B82F6", "#10B981", "#8B5CF6"][index],
  };
});

export const quickActionsData = [
  {
    id: "add-product",
    label: "Tambah Produk",
    icon: "package-plus",
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
    border: "border-orange-100",
    href: "/products",
  },
  {
    id: "manage-stock",
    label: "Kelola Stok",
    icon: "boxes",
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    border: "border-blue-100",
    href: "/products",
  },
  {
    id: "add-customer",
    label: "Tambah Pelanggan",
    icon: "user-plus",
    bg: "bg-green-50",
    iconColor: "text-green-500",
    border: "border-green-100",
    href: "/customers",
  },
  {
    id: "add-supplier",
    label: "Tambah Supplier",
    icon: "truck",
    bg: "bg-purple-50",
    iconColor: "text-purple-500",
    border: "border-purple-100",
    href: "/suppliers",
  },
  {
    id: "integration",
    label: "Integrasi",
    icon: "link-2",
    bg: "bg-yellow-50",
    iconColor: "text-yellow-500",
    border: "border-yellow-100",
    href: "/settings",
  },
];
