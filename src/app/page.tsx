"use client";
//Sara 
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext"; // 👈 ruta corregida con alias

export default function RootPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;

    // Esperar a que isAuthenticated tenga un valor real
    if (isAuthenticated === undefined || isAuthenticated === null) return;

    redirected.current = true;

    if (isAuthenticated) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="text-center">
        <h1 className="mb-2">Red por la Ciberseguridad</h1>
        <p className="mb-3">Cargando…</p>
        <div
          className="spinner-border text-primary"
          role="status"
          aria-label="Cargando"
        />
      </div>
    </main>
  );
}
