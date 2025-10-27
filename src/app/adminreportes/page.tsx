"use client";
import { useEffect, useRef, useState } from "react";
import type { DataTable as SimpleDataTable } from "simple-datatables";

type ApiStatus = "pending" | "validated" | "rejected";

type Row = {
  id: number;
  user_id: number | null;
  created: string;
  url: string | null;
  photo_path: string | null;
  status: string;          
  published: boolean;
  description: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const STATUS_LABEL: Record<ApiStatus, string> = {
  pending: "Pendiente",
  validated: "Aceptado",
  rejected: "Rechazado",
};
const LABEL_TO_API: Record<string, ApiStatus> = {
  pendiente: "pending",
  aceptado: "validated",
  rechazado: "rejected",
  pending: "pending",
  validated: "validated",
  rejected: "rejected",
};
const toApiStatus = (s: string): ApiStatus =>
  LABEL_TO_API[(s || "").toLowerCase().trim()] ?? "pending";
const toUiLabel = (s: string) => STATUS_LABEL[toApiStatus(s)];
const pubText = (p: boolean) => (p ? "Published" : "Unpublished");

export default function AdminReportes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dtRef = useRef<SimpleDataTable | null>(null);

  // -------- Utils API ----------
  const getToken = () => {
    const t =
      (typeof window !== "undefined" &&
        (localStorage.getItem("accessToken") || localStorage.getItem("token"))) ||
      "";
    return t.replaceAll(/"/g, "");
  };

  async function apiJSON(path: string, method: string, body?: any) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      cache: "no-store",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const raw = !res.ok ? await res.text().catch(() => "") : null;
    if (!res.ok) {
      let msg = raw || "";
      try {
        const j = raw ? JSON.parse(raw) : null;
        if (j?.message) msg = j.message;
      } catch {}
      throw new Error(`HTTP ${res.status}${msg ? ` - ${msg}` : ""}`);
    }
    try { return await res.json(); } catch { return {}; }
  }

  const reload = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data: Row[] = await apiJSON(`/admin/reports/incidents?t=${Date.now()}`, "GET");
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Error cargando incidentes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let cancelled = false;

    if (dtRef.current) {
      try { dtRef.current.destroy(); } catch {}
      dtRef.current = null;
    }

    root.innerHTML = "";

    if (rows.length === 0) {
      return () => { cancelled = true; };
    }

    const table = document.createElement("table");
    table.className = "table table-sm align-middle";
    table.id = "datatable-admin-reportes";
    root.appendChild(table);

    (async () => {
      const { DataTable } = await import("simple-datatables");

      if (cancelled || !table.isConnected || !table.parentElement) return;

      dtRef.current = new DataTable(table, {
        data: {
          headings: [
            "ID","User ID","Creado","URL","Evidencia",
            "Estatus","Publicado","Descripción","Actualizar"
          ],
          data: rows.map((r) => {
            const id = r.id;
            const url = r.url || "-";
            const photo = r.photo_path
              ? `<a href="${escapeAttr(r.photo_path)}" target="_blank" rel="noreferrer">${escapeHtml(r.photo_path)}</a>`
              : "-";
            const status = toUiLabel(r.status);
            const published = pubText(r.published);
            const actions = actionMenuHtml();
            return [
              String(r.id),
              r.user_id == null ? "NULL" : String(r.user_id),
              escapeHtml(r.created),
              escapeHtml(url),
              photo,
              badgeHtml(statusClass(toApiStatus(r.status)), status),
              badgeHtml(r.published ? "pub-yes" : "pub-no", published),
              escapeHtml(r.description || "-"),
              `<div class="actions-cell text-nowrap" data-id="${id}">${actions}</div>`,
            ];
          }),
        },
        searchable: true,
        fixedHeight: false,
        perPage: 10,
        perPageSelect: [5, 10, 25, 50],
        columns: [{ select: 8, sortable: false }],
        labels: {
          placeholder: "Buscar…",
          perPage: "entradas por página",
          noRows: "Sin datos para mostrar",
          info: "Mostrando {start} a {end} de {rows} entradas",
        },
      });
    })();

    return () => {
      cancelled = true;
      if (dtRef.current) {
        try { dtRef.current.destroy(); } catch {}
        dtRef.current = null;
      }
    };
  }, [rows]);
  // 🔹 Fin del useEffect corregido

  async function handleSetStatus(id: number, newStatusUiOrApi: string) {
    const apiStatus = toApiStatus(newStatusUiOrApi);
    setRows((prev) => prev.map(r => r.id === id ? ({ ...r, status: apiStatus }) : r));
    try {
      await apiJSON(`/admin/reports/incidents/${id}/status`, "PUT", { status: apiStatus });
      await reload();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar el estado.");
      await reload();
    }
  }

  async function handlePublish(id: number) {
    setRows((prev) => prev.map(r => r.id === id ? ({ ...r, published: true }) : r));
    try {
      await apiJSON(`/admin/reports/incidents/${id}/publish`, "PUT");
      await reload();
    } catch (e) {
      console.error(e);
      alert("No se pudo publicar.");
      await reload();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este reporte? Esta acción no se puede deshacer.")) return;
    const prev = rows;
    setRows(prev.filter(r => r.id !== id));
    try {
      await apiJSON(`/admin/reports/incidents/${id}`, "DELETE");
      await reload();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar.");
      await reload();
    }
  }

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onClick = (ev: Event) => {
      const target = ev.target as HTMLElement | null;
      const item = target?.closest<HTMLAnchorElement>(".dropdown-item");
      if (!item) return;

      const host = item.closest<HTMLElement>(".actions-cell");
      const idStr = host?.dataset.id || "";
      const id = Number.parseInt(idStr, 10);
      if (!Number.isFinite(id)) return;

      if (item.classList.contains("action-set-status")) {
        const nuevo = (item.dataset.status || "").trim();
        handleSetStatus(id, nuevo);
      }
      if (item.classList.contains("action-publish")) {
        handlePublish(id);
      }
      if (item.classList.contains("action-delete")) {
        handleDelete(id);
      }
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [rows]); 

  return (
    <div className="container px-4" style={{ maxWidth: "1200px", marginRight: "2rem" }}>
      <style>{`
  .table { 
    font-size:.92rem; 
    table-layout: fixed; 
    width: 100%; 
    border-collapse: collapse;
  }
  .table-responsive { overflow-x: hidden !important; }

  .table td, .table th {
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
    vertical-align: middle;
    text-align: left;
  }

#datatable-admin-reportes th:nth-child(1),
#datatable-admin-reportes td:nth-child(1) { width: 5%; }   /* ID */

#datatable-admin-reportes th:nth-child(2),
#datatable-admin-reportes td:nth-child(2) { width: 6%; }   /* User ID (más chica) */

#datatable-admin-reportes th:nth-child(3),
#datatable-admin-reportes td:nth-child(3) { width: 9%; }  /* Creado */

#datatable-admin-reportes th:nth-child(4),
#datatable-admin-reportes td:nth-child(4) { width: 18%; }  /* URL */

#datatable-admin-reportes th:nth-child(5),
#datatable-admin-reportes td:nth-child(5) { width: 10%; }  /* Evidencia */

#datatable-admin-reportes th:nth-child(6),
#datatable-admin-reportes td:nth-child(6) { width: 8%; }   /* Estatus (más chica) */

#datatable-admin-reportes th:nth-child(7),
#datatable-admin-reportes td:nth-child(7) { width: 10%; }   /* Publicado (un poco más chica) */

#datatable-admin-reportes th:nth-child(8),
#datatable-admin-reportes td:nth-child(8) { width: 27%; }  /* Descripción */

#datatable-admin-reportes th:nth-child(9),
#datatable-admin-reportes td:nth-child(9) { width: 8%; text-align:center;} /* Actualizar (más ancha) */


  .badge-rounded {
    border-radius:8px;
    padding:.22em .45em;
    font-size:.78em;
    font-weight:500;
    display:inline-block;
    text-align:center;
  }
  .status-pending{background:#fff3cd;color:#856404;border:1px solid #ffeeba}
  .status-accepted{background:#d4edda;color:#155724;border:1px solid #c3e6cb}
  .status-rejected{background:#f8d7da;color:#721c24;border:1px solid #f5c6cb}
  .pub-yes{background:#cce5ff;color:#004085;border:1px solid #b8daff}
  .pub-no{background:#e2e3e5;color:#383d41;border:1px solid #d6d8db}
  .dropdown-menu{z-index:2000!important}
`}</style>

<h1 className="mt-4 mb-3">Mis reportes</h1>

      <div className="card mb-4">
        <div className="card-header"><i className="fas fa-list me-1" /> Lista de Incidentes</div>
        <div className="card-body">
          {err && <div className="alert alert-danger py-2 mb-3">{err}</div>}
          {loading && <div className="alert alert-secondary py-2 mb-3">Cargando…</div>}

          <div className="table-responsive">
            <div ref={containerRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replaceAll(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
function escapeAttr(s: string) {
  return escapeHtml(s).replaceAll(/"/g, "&quot;");
}
function statusClass(api: ApiStatus) {
  if (api === "pending") return "status-pending";
  if (api === "validated") return "status-accepted";
  return "status-rejected";
}
function badgeHtml(cls: string, text: string) {
  return `<span class="badge-rounded ${cls}">${escapeHtml(text)}</span>`;
}
function actionMenuHtml() {
  return `
    <div class="dropdown">
      <button class="btn btn-outline-secondary btn-sm" type="button"
              data-bs-toggle="dropdown" data-bs-container="body" data-bs-offset="0,8" title="Editar">
        +<i class="fas fa-pen"></i>
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li class="dropdown-header">Cambiar estado</li>
        <li><a class="dropdown-item action-set-status" data-status="pending" href="#">Pendiente</a></li>
        <li><a class="dropdown-item action-set-status" data-status="validated" href="#">Aceptado</a></li>
        <li><a class="dropdown-item action-set-status" data-status="rejected" href="#">Rechazado</a></li>
        <li><hr class="dropdown-divider" /></li>
        <li><a class="dropdown-item action-publish" href="#">Publicar</a></li>
        <li><a class="dropdown-item text-danger action-delete" href="#">Eliminar reporte</a></li>
      </ul>
    </div>
  `;
}

