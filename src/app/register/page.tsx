"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services";
import { useSession } from "@/contexts/SessionContext";

type RegisterForm = {
  nama: string;
  email: string;
  password: string;
};

const emptyForm: RegisterForm = {
  nama: "",
  email: "",
  password: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegisterPage() {
  const router = useRouter();
  const { setSessionUser } = useSession();
  const [form, setForm] = useState<RegisterForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm | "form", string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  function validate() {
    const nextErrors: Partial<Record<keyof RegisterForm, string>> = {};

    if (!form.nama.trim()) nextErrors.nama = "Nama wajib diisi";
    if (!form.email.trim()) nextErrors.email = "Email wajib diisi";
    else if (!isValidEmail(form.email)) nextErrors.email = "Format email tidak valid";
    if (!form.password) nextErrors.password = "Password wajib diisi";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSuccess("");
    const response = await authService.register({
      nama: form.nama.trim(),
      email: form.email.trim(),
      password: form.password,
      role: "owner",
    });

    if (!response.success || !response.data) {
      setErrors(response.errors ?? { form: response.message });
      setLoading(false);
      return;
    }

    setSessionUser(response.data);
    setSuccess("Registrasi berhasil. Mengarahkan ke pemilihan paket...");
    setTimeout(() => router.push("/subscription"), 600);
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <Image
          src="/login-register/regis.svg"
          alt="POSmart Register"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF6B00] shadow-lg">
          <Image
            src="/icons/sidebar/logo.svg"
            alt="P"
            width={26}
            height={26}
            className="brightness-0 invert"
            style={{ objectFit: "none", objectPosition: "0 center" }}
          />
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-[#F5F6FA] p-8 lg:w-1/2">
        <div className="w-full max-w-[420px]">
          <div className="mb-6">
            <Image src="/icons/sidebar/logo.svg" alt="POSmart" width={130} height={36} priority />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Buat akun POSmart</h1>
            <p className="mt-1 text-sm text-gray-500">Daftar sebagai owner untuk mulai memilih paket dan mengatur usaha.</p>
          </div>

          {success && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              {success}
            </div>
          )}

          {errors.form && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                value={form.nama}
                onChange={(event) => setForm((current) => ({ ...current, nama: event.target.value }))}
                placeholder="Nama lengkap Anda"
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${errors.nama ? "border-red-300" : "border-gray-200"
                  }`}
              />
              {errors.nama && <p className="mt-1 text-xs font-semibold text-red-500">{errors.nama}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="nama@email.com"
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${errors.email ? "border-red-300" : "border-gray-200"
                  }`}
              />
              {errors.email && <p className="mt-1 text-xs font-semibold text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Password akun"
                  className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${errors.password ? "border-red-300" : "border-gray-200"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs font-semibold text-red-500">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#FF6B00] py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#e85f00] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Memproses registrasi..." : "Daftar dan Pilih Paket"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-orange-500 hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
