"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import {
  roleBadge,
  rolePermissions,
  type Member,
  type Permission,
  type Role,
} from "@/data/team";
import { teamService } from "@/services";
import type { User, UserRole } from "@/types/posmart";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Info,
  Loader2,
  MessageCircle,
  Plus,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

type EmployeeRole = Extract<Role, "Admin" | "Kasir">;
type InviteForm = { name: string; email: string; password: string; role: EmployeeRole };
type InviteErrors = Partial<Record<"name" | "email" | "password" | "role" | "form", string>>;

const EMPLOYEE_ROLES: EmployeeRole[] = ["Admin", "Kasir"];
const ALL_PERMISSIONS: Permission[] = [
  "Dashboard", "POS / Kasir", "Produk & Inventori", "Transaksi",
  "Pelanggan", "Supplier", "Team & Roles", "Laporan & Analisis", "Pengaturan",
];

const emptyInvite: InviteForm = { name: "", email: "", password: "", role: "Kasir" };

function initPerms() {
  const result = {} as Record<Role, Set<Permission>>;
  for (const [role, perms] of Object.entries(rolePermissions)) {
    result[role as Role] = new Set(perms as Permission[]);
  }
  return result;
}

function initialsFor(name: string) {
  return name.split(" ").slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("");
}

function roleLabel(role: UserRole): Role {
  if (role === "admin") return "Admin";
  if (role === "kasir") return "Kasir";
  return "Owner";
}

function roleValue(role: EmployeeRole): Exclude<UserRole, "owner"> {
  return role === "Admin" ? "admin" : "kasir";
}

function memberFromUser(user: User, index: number): Member {
  const colors: [string, string][] = [
    ["#DC2626", "#FFFFFF"],
    ["#D97706", "#FFFFFF"],
    ["#059669", "#FFFFFF"],
    ["#7C3AED", "#FFFFFF"],
    ["#2563EB", "#FFFFFF"],
  ];

  return {
    id: user.userId,
    name: user.nama,
    email: user.email,
    role: roleLabel(user.role),
    joinDate: new Date(user.createdAt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    avatarColor: colors[index % colors.length],
    initials: initialsFor(user.nama),
  };
}

function apiErrors(errors: Record<string, string> | undefined, fallback: string): InviteErrors {
  return {
    ...(errors?.nama ? { name: errors.nama } : {}),
    ...(errors?.email ? { email: errors.email } : {}),
    ...(errors?.password ? { password: errors.password } : {}),
    ...(errors?.role ? { role: errors.role } : {}),
    form: errors?.request ?? fallback,
  };
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [hoveredId, setHovered] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showPerms, setShowPerms] = useState(false);
  const [inviteForm, setInvite] = useState<InviteForm>(emptyInvite);
  const [perms, setPerms] = useState<Record<Role, Set<Permission>>>(initPerms);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [inviteErrors, setInviteErrors] = useState<InviteErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  const members = useMemo(() => users.map(memberFromUser), [users]);

  useEffect(() => {
    let mounted = true;

    async function loadMembers() {
      setLoading(true);
      setPageError("");
      const response = await teamService.list();
      if (!mounted) return;

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setPageError(response.message);
      }
      setLoading(false);
    }

    void loadMembers();
    return () => {
      mounted = false;
    };
  }, []);

  function togglePerm(role: Role, perm: Permission) {
    if (role === "Owner" || role === "Super Admin") return;
    setPerms((current) => {
      const next = { ...current, [role]: new Set(current[role]) };
      if (next[role].has(perm)) next[role].delete(perm);
      else next[role].add(perm);
      return next;
    });
  }

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    const validation: InviteErrors = {};
    if (!inviteForm.name.trim()) validation.name = "Nama lengkap wajib diisi";
    if (!inviteForm.email.trim()) validation.email = "Email wajib diisi";
    if (!inviteForm.password) validation.password = "Password awal wajib diisi";
    if (inviteForm.password && inviteForm.password.length < 6) validation.password = "Password minimal 6 karakter";
    if (!EMPLOYEE_ROLES.includes(inviteForm.role)) validation.role = "Role karyawan harus Admin atau Kasir";

    if (Object.keys(validation).length > 0) {
      setInviteErrors(validation);
      return;
    }

    setIsSubmitting(true);
    setInviteErrors({});
    setSuccessMessage("");

    const response = await teamService.invite({
      nama: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      password: inviteForm.password,
      role: roleValue(inviteForm.role),
    });

    setIsSubmitting(false);

    if (!response.success || !response.data) {
      setInviteErrors(apiErrors(response.errors, response.message));
      return;
    }

    setUsers((current) => [response.data!, ...current]);
    setSuccessMessage("Karyawan berhasil dibuat dan tersimpan di database.");
    setShowInvite(false);
    setInvite(emptyInvite);
  }

  function closeInvite() {
    if (isSubmitting) return;
    setShowInvite(false);
    setInvite(emptyInvite);
    setInviteErrors({});
  }

  return (
    <DashboardLayout>
      {successMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <CheckCircle2 size={16} />
          {successMessage}
          <button onClick={() => setSuccessMessage("")} className="ml-auto text-green-500">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team &amp; Roles</h1>
          <p className="mt-0.5 text-sm text-gray-500">Atur tim anda</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPerms((current) => !current)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Info size={14} />
            Hak Akses
          </button>
          <button
            onClick={() => {
              setShowInvite(true);
              setInviteErrors({});
              setSuccessMessage("");
            }}
            className="flex items-center gap-2 rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E05E00]"
          >
            <Plus size={15} strokeWidth={2.5} />
            Invite Member
          </button>
        </div>
      </div>

      {showPerms && (
        <div className="mb-5 overflow-hidden rounded-[20px] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50">
                <ShieldCheck size={15} className="text-[#FF6B00]" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Hak Akses per Role</p>
                <p className="mt-0.5 text-xs text-gray-400">Klik centang untuk mengubah akses Admin atau Kasir</p>
              </div>
            </div>
            <button onClick={() => setShowPerms(false)} className="text-gray-300 hover:text-gray-500">
              <X size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Fitur</th>
                  {(["Owner", "Admin", "Kasir"] as Role[]).map((role) => (
                    <th key={role} className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${roleBadge[role].bg} ${roleBadge[role].text}`}>
                        {role}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((perm, index) => (
                  <tr key={perm} className={index < ALL_PERMISSIONS.length - 1 ? "border-b border-gray-50" : ""}>
                    <td className="px-6 py-3 text-xs font-semibold text-gray-600">{perm}</td>
                    {(["Owner", "Admin", "Kasir"] as Role[]).map((role) => {
                      const hasAccess = perms[role].has(perm);
                      const isLocked = role === "Owner";
                      return (
                        <td key={role} className="px-4 py-3 text-center">
                          <button
                            onClick={() => togglePerm(role, perm)}
                            title={isLocked ? "Owner selalu punya akses penuh" : hasAccess ? "Cabut akses" : "Beri akses"}
                            className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md transition-all ${
                              hasAccess
                                ? isLocked
                                  ? "bg-green-100 text-green-500 cursor-not-allowed"
                                  : "bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer"
                                : isLocked
                                  ? "cursor-not-allowed"
                                  : "hover:bg-gray-100 cursor-pointer"
                            }`}
                          >
                            {hasAccess ? <Check size={12} strokeWidth={3} /> : <span className="block h-0.5 w-3 rounded-full bg-gray-200" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-50 px-6 py-3">
            <p className="text-[11px] text-gray-400">
              <span className="font-semibold text-orange-500">Owner</span> selalu memiliki akses penuh dan tidak dapat diubah.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-[20px] bg-[#F5F6FA] p-4">
        <p className="mb-3 px-2 text-sm font-bold text-gray-700">Karyawan</p>
        <div className="space-y-1">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              Memuat karyawan...
            </div>
          )}

          {!loading && pageError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{pageError}</span>
            </div>
          )}

          {!loading && !pageError && members.map((member) => {
            const badge = roleBadge[member.role];
            const isHovered = hoveredId === member.id;
            return (
              <div
                key={member.id}
                onMouseEnter={() => setHovered(member.id)}
                onMouseLeave={() => setHovered(null)}
                className={`flex cursor-default items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                  isHovered ? "bg-orange-50" : "bg-transparent"
                }`}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: member.avatarColor[0], color: member.avatarColor[1] }}
                >
                  {member.initials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="truncate text-xs text-gray-500">{member.email}</p>
                </div>

                <span className="hidden text-xs font-semibold text-gray-400 md:inline">{member.joinDate}</span>
                <span className={`hidden rounded-lg px-2 py-0.5 text-[10px] font-bold sm:inline-block ${badge.bg} ${badge.text}`}>
                  {member.role}
                </span>

                {isHovered && (
                  <div className="ml-2 flex items-center gap-1">
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-600">
                      <MessageCircle size={14} />
                    </button>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-orange-100 hover:text-orange-600">
                      <Star size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {!loading && !pageError && members.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">
              Belum ada karyawan. Invite member pertama!
            </div>
          )}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={closeInvite} aria-label="Tutup invite member" />
          <div className="relative w-full max-w-[420px] rounded-[24px] bg-white p-7 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Invite Anggota Baru</h3>
                <p className="mt-0.5 text-xs text-gray-400">Buat akun karyawan untuk bergabung ke tim</p>
              </div>
              <button onClick={closeInvite} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              {inviteErrors.form && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium leading-relaxed text-red-600">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  <span>{inviteErrors.form}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={inviteForm.name}
                  onChange={(event) => setInvite((current) => ({ ...current, name: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300"
                />
                {inviteErrors.name && <p className="mt-1 text-xs font-medium text-red-500">{inviteErrors.name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Alamat Email</label>
                <input
                  type="email"
                  placeholder="nama@toko.com"
                  value={inviteForm.email}
                  onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300"
                />
                {inviteErrors.email && <p className="mt-1 text-xs font-medium text-red-500">{inviteErrors.email}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password Awal</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={inviteForm.password}
                  onChange={(event) => setInvite((current) => ({ ...current, password: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-300"
                />
                {inviteErrors.password && <p className="mt-1 text-xs font-medium text-red-500">{inviteErrors.password}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {EMPLOYEE_ROLES.map((role) => {
                    const badge = roleBadge[role];
                    const isActive = inviteForm.role === role;
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => setInvite((current) => ({ ...current, role }))}
                        className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                          isActive
                            ? `${badge.bg} ${badge.text} border-transparent`
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
                {inviteErrors.role && <p className="mt-1 text-xs font-medium text-red-500">{inviteErrors.role}</p>}

                <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Akses {inviteForm.role}</p>
                  <p className="text-xs text-gray-500">
                    {[...perms[inviteForm.role]].join(" - ") || "Tidak ada akses"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeInvite}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] py-3 text-sm font-bold text-white hover:bg-[#E05E00] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                  {isSubmitting ? "Menyimpan..." : "Kirim Undangan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
