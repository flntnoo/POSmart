"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { authService } from "@/services";
import type { UserRole } from "@/types/posmart";

export default function LoginPage() {
  const router = useRouter();
  const { setSessionUser } = useSession();
  const [activeTab, setActiveTab] = useState<"owner" | "karyawan">("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("owner@posmart.test");
  const [ownerPassword, setOwnerPassword] = useState("password123");
  const [employeeEmail, setEmployeeEmail] = useState("kasir@posmart.test");
  const [employeePassword, setEmployeePassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(role: UserRole) {
    setLoading(true);
    setError("");
    const response = await authService.login({
      email: role === "owner" ? ownerEmail : employeeEmail,
      password: role === "owner" ? ownerPassword : employeePassword,
      role,
    });
    setLoading(false);

    if (!response.success || !response.data) {
      setError(response.message);
      return;
    }

    setSessionUser(response.data);
    router.push(role === "kasir" ? "/pos" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Login image */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <Image
          src="/login-register/Login.svg"
          alt="POSmart Login"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Logo badge */}
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

      {/* Right: Form Panel */}
      <div className="flex w-full items-center justify-center bg-[#F5F6FA] p-8 lg:w-1/2">
        <div className="w-full max-w-[380px]">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/icons/sidebar/logo.svg"
              alt="POSmart"
              width={130}
              height={36}
              priority
            />
          </div>

          {/* Heading */}
          <div className="mb-7">
            <p className="mb-1 text-sm font-medium text-orange-500">
              Selamat datang kembali!
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Masuk ke Akun</h1>
            <p className="mt-1 text-sm text-gray-500">
              Pilih peran Anda untuk melanjutkan
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* Tab toggle */}
          <div className="mb-6 flex gap-1.5 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab("owner")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200
                ${activeTab === "owner"
                  ? "bg-[#FF6B00] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Owner
            </button>
            <button
              onClick={() => setActiveTab("karyawan")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200
                ${activeTab === "karyawan"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Karyawan
            </button>
          </div>

          {/* Owner Form */}
          {activeTab === "owner" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  placeholder="Masukkan email"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={ownerPassword}
                    onChange={(event) => setOwnerPassword(event.target.value)}
                    placeholder="Masukkan password"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-orange-500"
                  />
                  <span className="text-sm text-gray-600">Ingat saya</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-orange-500 hover:underline"
                >
                  Lupa password?
                </Link>
              </div>

              <button
                onClick={() => void handleLogin("owner")}
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-[#FF6B00] py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#e85f00] active:scale-[0.99]">
                {loading ? "Memproses..." : "Masuk sebagai Owner"}
              </button>
            </div>
          )}

          {/* Karyawan Form */}
          {activeTab === "karyawan" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email Karyawan
                </label>
                <input
                  type="email"
                  value={employeeEmail}
                  onChange={(event) => setEmployeeEmail(event.target.value)}
                  placeholder="kasir@posmart.test"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password Karyawan
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={employeePassword}
                    onChange={(event) => setEmployeePassword(event.target.value)}
                    placeholder="Masukkan password karyawan"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => void handleLogin("kasir")}
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-slate-800 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-700 active:scale-[0.99]"
              >
                {loading ? "Memproses..." : "Masuk sebagai Karyawan"}
              </button>
            </div>
          )}

          <p className="mt-7 text-center text-sm text-gray-500">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-orange-500 hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
