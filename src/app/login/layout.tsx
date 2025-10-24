"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirige SOLO cuando ya sabemos que SÍ hay sesión
  useEffect(() => {
    if (isAuthenticated === true) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Mientras AuthContext resuelve (evita parpadeo)
  if (isAuthenticated === undefined || isAuthenticated === null) {
    return null; // o un loader pequeño si prefieres
  }

  // Si NO hay sesión, muestra el login (children)
  if (isAuthenticated === false) {
    return <>{children}</>;
  }

  // Si SÍ hay sesión, no montes el login mientras hace replace
  return null;
}
