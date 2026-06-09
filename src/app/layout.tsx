import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Ruined Youth HQ",
  description: "Social media management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex">
        <Sidebar />
        <main className="flex-1 ml-56 min-h-screen overflow-auto p-6">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#111",
              color: "#f0f0f0",
              border: "1px solid #1f1f1f",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
