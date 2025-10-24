"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminReportesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();


useEffect(() => {
  if (isAuthenticated === false) {
    router.replace("/login");
  }
}, [isAuthenticated, router]);

if (isAuthenticated !== true) return null;

return <DashboardLayout>{children}</DashboardLayout>;
}
