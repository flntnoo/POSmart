import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "POSmart",
  description: "Point of Sale Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${lora.variable}`}
    >
      <body className="font-body min-h-screen bg-[#F5F6FA]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
