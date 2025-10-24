"use client";
import { useEffect, useRef, useState } from "react";

type Incident = {
  id: number;
  user_id: number | null;
  created: string;                           // 'YYYY-MM-DD HH:mm:ss'
  url: string | null;                        // page_url as 'url'
  anonymous: "Yes" | "No";
  admin_id: number | null;
  status: string;                            // viene de JOIN con statuses.name (p.ej. 'Pending')
  published: "Published" | "Unpublished";
  description: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function ReportesPage() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const tableRef = useRef<HTMLTableElement | null>(null);
  const dtRef = useRef<any>(null);

  useEffect(() => {

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);

        const token =
          (typeof window !== "undefined" &&
            (localStorage.getItem("accessToken") || localStorage.getItem("token"))) ||
          "";

       const res = await fetch(`${API_BASE}/admin/reports/incident`, {
  method: "GET",
  headers: {
    Accept: "application/json",                 
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token.replace(/"/g, "")}` } : {}),
  },
  signal: controller.signal,
});


        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} - ${txt}`);
        }

        const data: Incident[] = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Error cargando incidentes:", err);
          setErrMsg(err?.message ?? "Error cargando incidentes");
          setRows([]);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }
  
  , []);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      if (cancelled) return;
      if (!tableRef.current) return;

      if (rows.length === 0) return;

      if (dtRef.current) {
        try { dtRef.current.destroy(); } catch {}
        dtRef.current = null;
      }

      const { DataTable } = await import("simple-datatables");
      if (cancelled || !tableRef.current) return;

      dtRef.current = new DataTable(tableRef.current, {
        searchable: true,
        fixedHeight: false,
        perPage: 10,
        perPageSelect: [5, 10, 25, 50],
        labels: {
          placeholder: "Buscar…",
          perPage: "entradas por página",
          noRows: "Sin datos para mostrar",
          info: "Mostrando {start} a {end} de {rows} entradas",
        },
      });
    }

    mount();

    return () => {
      cancelled = true;
      try { dtRef.current?.destroy(); } catch {}
      dtRef.current = null;
    };
  }, [rows]); 

  const statusBadgeClass = (s: string) => {
    const x = s.toLowerCase();
    if (x.includes("pending")) return "status-pending";
    if (x.includes("review") || x.includes("validated") || x.includes("resuelto")) return "status-validated";
    if (x.includes("reject") || x.includes("eliminado")) return "status-rejected";
    return "status-pending";
  };

  return (
    <div className="container px-4" style={{ maxWidth: "1200px", marginRight: "2rem" }}>
      <style>{`
        .dt-wrap .dataTable-wrapper { max-width:1080px; margin:0 auto; }
        @media (min-width:1400px){ .dt-wrap .dataTable-wrapper { max-width:1120px; } }
        .table { font-size:.90rem; }
        .table>:not(caption)>*>* { padding:.36rem .52rem; }
        .align-middle td, .align-middle th { vertical-align: middle; }
        .dataTable-wrapper, .dataTable-container, .table-responsive { overflow: visible !important; }
        .dataTable-table th:nth-child(1), .dataTable-table td:nth-child(1) { width: 56px;  white-space: nowrap; }
        .dataTable-table th:nth-child(2), .dataTable-table td:nth-child(2) { width: 80px;  white-space: nowrap; }
        .dataTable-table th:nth-child(3), .dataTable-table td:nth-child(3) { width: 160px; white-space: nowrap; }
        .dataTable-table th:nth-child(5), .dataTable-table td:nth-child(5) { width: 90px;  white-space: nowrap; }
        .dataTable-table th:nth-child(6), .dataTable-table td:nth-child(6) { width: 90px;  white-space: nowrap; }
        .dataTable-table th:nth-child(7), .dataTable-table td:nth-child(7) { width: 120px; white-space: nowrap; }
        .dataTable-table th:nth-child(8), .dataTable-table td:nth-child(8) { width: 120px; white-space: nowrap; }
        .dataTable-table th:nth-child(4), .dataTable-table td:nth-child(4) {
          max-width: 26ch; white-space: normal; word-break: break-word; overflow-wrap: anywhere;
        }
        .dataTable-table th:nth-child(9), .dataTable-table td:nth-child(9) {
          max-width: 26ch; white-space: normal; word-break: break-word; overflow-wrap: anywhere;
        }
        .badge-rounded{border-radius:8px;padding:.22em .45em;font-size:.78em;font-weight:500}
        .status-pending{background:#fff3cd;color:#856404;border:1px solid #ffeeba}
        .status-validated{background:#d4edda;color:#155724;border:1px solid #c3e6cb}
        .status-rejected{background:#f8d7da;color:#721c24;border:1px solid #f5c6cb}
        .status-deleted{background:#e2e3e5;color:#383d41;border:1px solid #d6d8db}
        .pub-yes{background:#cce5ff;color:#004085;border:1px solid #b8daff}
        .pub-no{background:#e2e3e5;color:#383d41;border:1px solid #d6d8db}
        .truncate, .truncate-sm { display:inline-block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      `}</style>

      <h1 className="mt-4">Reportes</h1>

      <div className="card mb-4">
        <div className="card-header">
          <i className="fas fa-list me-1" /> Lista de Reportes
        </div>
        <div className="card-body">
          {errMsg && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {errMsg}
            </div>
          )}
          {loading && (
            <div className="alert alert-secondary py-2 mb-3" role="status">
              Cargando…
            </div>
          )}

          <div className="table-responsive dt-wrap">
            <table ref={tableRef} id="datatable-reportes" className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ID Usuario</th>
                  <th>Fecha</th>
                  <th>URL</th>
                  <th>Anonimo</th>
                  <th>Admin ID</th>
                  <th>Estatus</th>
                  <th>Publicado</th>
                  <th>Descripcion</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.user_id ?? "NULL"}</td>
                    <td>{r.created}</td>
                    <td>
                      <span className="truncate" title={r.url || ""}>
                        {r.url || "-"}
                      </span>
                    </td>
                    <td>{r.anonymous}</td>
                    <td>{r.admin_id ?? "-"}</td>
                    <td>
                      <span className={`badge-rounded ${statusBadgeClass(r.status)}`}>{r.status}</span>
                    </td>
                    <td>
                      <span className={`badge-rounded ${r.published === "Published" ? "pub-yes" : "pub-no"}`}>
                        {r.published}
                      </span>
                    </td>
                    <td>
                      <span className="truncate-sm" title={r.description || ""}>
                        {r.description || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!loading && rows.length === 0) && (
                  <tr>
                    <td colSpan={9} className="text-center py-3">
                      Sin datos para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
