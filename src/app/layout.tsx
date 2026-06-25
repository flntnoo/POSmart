import type { Metadata } from "next";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "POSmart",
  description: "Point of Sale Management System",
  icons: {
    icon: "/Logo.svg",
    shortcut: "/Logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen bg-[#F5F6FA]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
