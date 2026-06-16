"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
  formatRpShort, avatarColor, calcTier, toCustomerView,
  type Customer, type CustomerTier,
} from "@/data/customers";
import { auditLogService, customerService, transactionService } from "@/services";
import { useSession } from "@/contexts/SessionContext";
import {
  Search, UserPlus, X, Phone, Calendar,
  ChevronRight, Crown, Star, Award, Users, Pencil, History,
  SlidersHorizontal,
} from "lucide-react";

type TierFilter = "Semua" | CustomerTier;
const tierTabs: TierFilter[] = ["Semua", "Gold", "Silver", "Member"];

const tierStyles: Record<CustomerTier, { pill: string; dot: string; icon: React.ReactNode; label: string }> = {
  Gold:   { pill: "bg-yellow-50 text-yellow-600 border border-yellow-200",   dot: "bg-yellow-400",  icon: <Crown  size={10} />, label: "Gold Member"   },
  Silver: { pill: "bg-slate-100 text-slate-500 border border-slate-200",     dot: "bg-slate-400",   icon: <Star   size={10} />, label: "Silver Member" },
  Bronze: { pill: "bg-orange-100 text-orange-700 border border-orange-200",  dot: "bg-orange-400",  icon: <Award  size={10} />, label: "Bronze Member" },
  Member: { pill: "bg-green-50 text-green-600 border border-green-200",      dot: "bg-green-400",   icon: <Users  size={10} />, label: "Member"        },
};

type AddForm = { name: string; email: string; phone: string; purchases: string; qty: string; address: string };
const emptyAdd: AddForm = { name: "", email: "", phone: "", purchases: "", qty: "", address: "" };

export default function CustomersPage() {
  const { currentUser } = useSession();
  const currentUserId = currentUser?.userId ?? "user-owner-001";
  const [search, setSearch]   = useState("");
  const [tierFilter, setTier] = useState<TierFilter>("Semua");
  const [detail, setDetail]   = useState<Customer | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(emptyAdd);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      customerService.list({ userId: currentUserId }),
      transactionService.list({ userId: currentUserId }),
    ]).then(([customerResponse, transactionResponse]) => {
      if (!mounted) return;
      const transactions = transactionResponse.success && transactionResponse.data ? transactionResponse.data : [];
      if (customerResponse.success && customerResponse.data) {
        setCustomers(customerResponse.data.map((customer) => toCustomerView(customer, transactions)));
      }
    });
    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  function handleAddSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const spent   = parseInt(addForm.purchases) || 0;
    const txCount = parseInt(addForm.qty)        || 0;
    const d = new Date();
    const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const today = `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
    const newCustomer: Customer = {
      id:                `C-${String(customers.length + 1).padStart(3, "0")}`,
      name:              addForm.name,
      phone:             addForm.phone,
      email:             addForm.email,
      totalTransactions: txCount,
      totalSpent:        spent,
      lastTransaction:   today,
      joinDate:          today,
      visits:            txCount,
      status:            txCount > 1 ? "Aktif" : "Tidak Aktif",
      tier:              calcTier(spent, txCount),
      recentItems:       [],
      recentTx:          [],
    };
    customerService.create({
      userId: currentUserId,
      nama: newCustomer.name,
      email: newCustomer.email,
      telepon: newCustomer.phone,
    }).then((response) => {
      if (response.success && response.data) {
        setCustomers(prev => [toCustomerView(response.data, []), ...prev]);
      } else {
        setCustomers(prev => [newCustomer, ...prev]);
      }
    });
    void auditLogService.create({
      userId: currentUserId,
      aksi: `Membuat pelanggan ${newCustomer.name}`,
      module: "customers",
    });
    setAddForm(emptyAdd);
    setShowAdd(false);
  }

  const stats = useMemo(() => {
    const aktif    = customers.filter(c => c.status === "Aktif").length;
    const total    = customers.reduce((s, c) => s + c.totalSpent, 0);
    const avg      = customers.length > 0 ? Math.round(total / customers.length) : 0;
    const top4     = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 4);
    return { aktif, avg, top4 };
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      // "Member" tab shows Bronze + Member
      if (tierFilter === "Member"  && c.tier !== "Member" && c.tier !== "Bronze") return false;
      if (tierFilter === "Gold"    && c.tier !== "Gold")   return false;
      if (tierFilter === "Silver"  && c.tier !== "Silver") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !c.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [customers, tierFilter, search]);

  function openDetail(c: Customer) { setDetail(c); setShowAdd(false); }
  function openAdd() { setShowAdd(true); setDetail(null); setAddForm(emptyAdd); }

  // ── ADD FORM PAGE ──────────────────────────────────────────────────────────
  if (showAdd) {
    return (
      <DashboardLayout>
        <div className="mb-1">
          <h1 className="text-xl font-bold text-gray-900">Pelanggan</h1>
        </div>
        <div className="mb-6 flex items-center gap-1 text-sm">
          <span className="text-gray-400">Dashboard</span>
          <ChevronRight size={13} className="text-gray-300" />
          <button onClick={() => setShowAdd(false)} className="text-gray-400 transition-colors hover:text-gray-600">
            Pelanggan
          </button>
          <ChevronRight size={13} className="text-gray-300" />
          <span className="font-semibold text-[#FF6B00]">Tambah Pelanggan</span>
        </div>

        <div className="max-w-[520px] rounded-[20px] bg-white p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Pelanggan</h2>
          <p className="mt-1 text-sm text-gray-400">
            Isi data pelanggan baru. Informasi ini akan tersimpan di database toko Anda.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleAddSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nama Pelanggan</label>
              <input type="text" placeholder="Input Name" value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
                <input type="email" placeholder="Input email" value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">No Handphone</label>
                <input type="tel" placeholder="Input no handphone" value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Total Belanja (Rp)</label>
                <input type="number" placeholder="contoh: 5000000" value={addForm.purchases}
                  onChange={e => setAddForm(f => ({ ...f, purchases: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Jumlah Pesanan</label>
                <input type="number" placeholder="contoh: 3" value={addForm.qty}
                  onChange={e => setAddForm(f => ({ ...f, qty: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Address</label>
              <textarea rows={4} placeholder="Input address" value={addForm.address}
                onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300" />
            </div>
            <button type="submit"
              className="w-full rounded-xl bg-[#FF6B00] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]">
              Tambah Pelanggan
            </button>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  // ── MAIN LIST VIEW ─────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pelanggan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Kelola data pelanggan anda</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E05E00]">
          <UserPlus size={15} />
          Tambah Pelanggan
        </button>
      </div>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-4 gap-4">
        {/* Card 1 – orange gradient */}
        <div
          className="relative overflow-hidden rounded-[20px] p-5"
          style={{ background: "linear-gradient(135deg, #FF6B00 0%, #FF9500 60%, #FFB347 100%)" }}
        >
          <div className="pointer-events-none absolute -right-7 -top-7 h-36 w-36 rounded-full border-2 border-white/20" />
          <div className="pointer-events-none absolute -right-1 -top-1 h-20 w-20 rounded-full border-2 border-white/20" />
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/25">
            <Users size={16} className="text-white" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">Total Pelanggan</p>
          <p className="mt-0.5 text-4xl font-extrabold text-white">{customers.length}</p>
        </div>

        {/* Card 2 – Member Aktif */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-orange-50">
            <UserPlus size={16} className="text-[#FF6B00]" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Member Aktif</p>
          <p className="mt-0.5 text-4xl font-extrabold text-gray-900">{stats.aktif}</p>
        </div>

        {/* Card 3 – Rata-rata belanja */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-orange-50">
            <Star size={16} className="text-[#FF6B00]" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Rata-rata belanja</p>
          <p className="mt-0.5 text-3xl font-extrabold text-gray-900">{formatRpShort(stats.avg)}</p>
        </div>

        {/* Card 4 – Top Pelanggan */}
        <div className="rounded-[20px] bg-white p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Top Pelanggan</p>
          <div className="flex items-center gap-2">
            {stats.top4.map((c) => {
              const idx = customers.findIndex(x => x.id === c.id);
              const [bg, fg] = avatarColor(idx);
              return (
                <div key={c.id} className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ring-2 ring-white shadow-sm"
                    style={{ background: bg, color: fg }}
                  >
                    {c.name.slice(0, 1)}
                  </div>
                  <p className="w-9 truncate text-center text-[9px] font-semibold text-gray-500">
                    {c.name.split(" ")[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari nama atau email pelanggan..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-64 rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 shadow-sm outline-none focus:border-orange-300" />
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-gray-100/80 p-1">
          {tierTabs.map(t => (
            <button key={t} onClick={() => setTier(t)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                tierFilter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50">
          <SlidersHorizontal size={14} />
          Filter
        </button>

        <div className="flex-1" />
        <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-500">
          {filtered.length} pelanggan
        </span>
      </div>

      {/* Content */}
      <div className="flex items-start gap-5">
        {/* Table */}
        <div className={`overflow-hidden rounded-[20px] bg-white shadow-sm ${detail ? "flex-1 min-w-0" : "w-full"}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Pelanggan</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Tier</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Bergabung</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Belanja</th>
                <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Pesanan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer, i) => {
                const idx = customers.findIndex(c => c.id === customer.id);
                const [bg, fg] = avatarColor(idx);
                const ts = tierStyles[customer.tier];
                const isSelected = detail?.id === customer.id;
                return (
                  <tr key={customer.id} onClick={() => openDetail(customer)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50/60 ${i < filtered.length - 1 ? "border-b border-gray-50" : ""} ${isSelected ? "bg-orange-50/40" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                          style={{ background: bg, color: fg }}>
                          {customer.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold leading-tight text-gray-800">{customer.name}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-400">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`flex w-fit items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${ts.pill}`}>
                        {ts.icon}
                        {customer.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{customer.joinDate}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800">{formatRpShort(customer.totalSpent)}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-700">
                      {customer.totalTransactions}<span className="ml-1 text-xs font-normal text-gray-400">×</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-14 text-center text-sm text-gray-400">Tidak ada pelanggan ditemukan</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5">
            <span className="text-xs text-gray-400">Menampilkan {filtered.length} dari {customers.length} pelanggan</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(page => (
                <button key={page}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    page === 1 ? "bg-[#FF6B00] text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}>
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profil Pelanggan panel */}
        {detail && (() => {
          const idx = customers.findIndex(c => c.id === detail.id);
          const [bg, fg] = avatarColor(idx);
          const ts = tierStyles[detail.tier];
          return (
            <div className="w-[285px] flex-shrink-0 overflow-hidden rounded-[20px] bg-white shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-bold text-gray-700">Profil Pelanggan</span>
                <button onClick={() => setDetail(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <X size={14} />
                </button>
              </div>

              {/* Avatar + identity */}
              <div className="flex flex-col items-center px-5 pb-4">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl font-bold shadow-md"
                  style={{ background: bg, color: fg }}>
                  {detail.name.slice(0, 1)}
                </div>
                <p className="mt-2.5 text-base font-bold text-gray-900">{detail.name}</p>
                <p className="text-xs text-gray-400">{detail.email}</p>
                <span className={`mt-2 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${ts.pill}`}>
                  {ts.icon}
                  {ts.label}
                </span>
              </div>

              <div className="mx-5 border-t border-gray-100" />

              {/* Contact */}
              <div className="space-y-2 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <Phone size={13} className="flex-shrink-0 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">{detail.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar size={13} className="flex-shrink-0 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Bergabung {detail.joinDate}</span>
                </div>
              </div>

              {/* Stats 3-col */}
              <div className="mx-5 mb-4 grid grid-cols-3 gap-1.5">
                <div className="flex flex-col items-center rounded-xl bg-[#FF6B00] px-1 py-3">
                  <p className="text-xs font-extrabold text-white leading-tight">{formatRpShort(detail.totalSpent)}</p>
                  <p className="mt-0.5 text-[9px] font-semibold text-white/70">Total Belanja</p>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-gray-50 px-1 py-3">
                  <p className="text-xl font-extrabold text-gray-900 leading-tight">{detail.totalTransactions}</p>
                  <p className="mt-0.5 text-[9px] font-semibold text-gray-400">Pesanan</p>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-gray-50 px-1 py-3">
                  <p className="text-xl font-extrabold text-gray-900 leading-tight">{detail.visits}</p>
                  <p className="mt-0.5 text-[9px] font-semibold text-gray-400">Kunjungan</p>
                </div>
              </div>

              {/* Riwayat Transaksi */}
              <div className="px-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Riwayat Transaksi</p>
                <div className="space-y-3">
                  {detail.recentTx.map((tx, i) => {
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[10px] font-bold text-orange-500">
                          {tx.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-800">{tx.name}</p>
                          <p className="text-[10px] text-gray-400">{tx.date}</p>
                        </div>
                        <span className="flex-shrink-0 text-xs font-bold text-green-600">
                          +{(tx.amount).toLocaleString("id-ID")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-2 p-5">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white transition-colors hover:bg-[#E05E00]">
                  <History size={14} />
                  Lihat Semua Transaksi
                </button>
                <button className="flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-600">
                  <Pencil size={13} />
                  Edit Profil
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
