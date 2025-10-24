// src/components/DashboardLayout.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGauge, faList, faTable, faUser, faUsers } from "@fortawesome/free-solid-svg-icons";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token");
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div className="antialiased sb-nav-fixed bg-white text-[#060025] min-h-screen">
      {/* Navbar superior */}
     <nav
  className="sb-topnav navbar navbar-expand navbar-dark px-3 py-1"
  style={{
    backgroundColor: "#455a64", 
    height: "44px",
    display: "flex",
    alignItems: "center",
  }}
>

        <Link
          className="navbar-brand ps-2"
          href="/dashboard"
          style={{ fontSize: "1.1rem", lineHeight: "1rem" }}
        >
          FraudX
        </Link>

        <ul className="navbar-nav ms-auto me-3 me-lg-4">
          <li className="nav-item dropdown">
            {}
            <a
              className="nav-link dropdown-toggle"
              id="navbarDropdown"
              href="#"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <FontAwesomeIcon icon={faUser} />
            </a>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Saliendo…" : "Cerrar sesión"}
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      {}
      <div
        className="d-flex"
        style={{
          minHeight: "calc(100vh - 44px)",
          marginTop: "44px",
        }}
      >
        {}
        <aside className="border-end border-secondary" style={{ width: 240 }}>
          <nav
            className="sb-sidenav accordion p-2 sidebar-custom" 
          >
            <div className="sb-sidenav-menu">
              <div className="nav">
                <div className="sb-sidenav-menu-heading">Core</div>
                <Link className="nav-link text-white" href="/dashboard">
                  <div className="sb-nav-link-icon">
                    <FontAwesomeIcon icon={faGauge} />
                  </div>
                  Dashboard
                </Link>

                <div className="sb-sidenav-menu-heading">Gestión</div>
                <Link className="nav-link text-white" href="/reportes">
                  <div className="sb-nav-link-icon">
                    <FontAwesomeIcon icon={faTable} />
                  </div>
                  Reportes
                </Link>
                <Link className="nav-link text-white" href="/listausuarios">
                  <div className="sb-nav-link-icon">
                    <FontAwesomeIcon icon={faUsers} />
                  </div>
                  Lista de Usuarios
                </Link>
                <Link className="nav-link text-white" href="/adminreportes">
                  <div className="sb-nav-link-icon">
                    <FontAwesomeIcon icon={faList} />
                  </div>
                  Mis reportes
                </Link>
              </div>
            </div>
          </nav>
        </aside>

        {/* Contenido */}
        <main className="flex-fill p-3" style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* 🔹 Estilos globales */}
      <style>{`
      
        .sidebar-custom {
          background-color: #455a64!important;
          color: #fff;
          min-height: calc(100vh - 44px);
        }

        /* Textos y hover */
        .sidebar-custom .sb-sidenav-menu-heading { 
          color: rgba(255, 255, 255, 0.6); 
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        .sidebar-custom .nav-link { color: #ffffffcc; }
        .sidebar-custom .nav-link:hover { color: #ffffff; }

        /* Evitar overflow horizontal del contenido */
        main { max-width: 100%; overflow-x: hidden; }
      `}</style>
    </div>
  );
}
