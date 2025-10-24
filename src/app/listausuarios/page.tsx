"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/network/axiosConfig";

// 🔹 Importa los estilos de simple-datatables (requeridos para buscador/flechas)
import "simple-datatables/dist/style.css";

type UserResponseDto = {
  id: number;
  email: string;
  is_admin: boolean | 0 | 1;
  user_status: "active" | "banned" | "suspended" | "pending";
  name?: string;
};

export default function ListaUsuariosPage() {
  const router = useRouter();

  const tableRef = useRef<HTMLTableElement | null>(null);
  const dtRef = useRef<any>(null);

  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Modales breves
  const [showAdd, setShowAdd] = useState(false);
  const [showDel, setShowDel] = useState(false);

  // Form add
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPass, setFPass] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);

  // Form delete
  const [delId, setDelId] = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  // Badges compactos
  const badgeAdmin = (v: 0 | 1) =>
    v === 1
      ? `<span class="badge-rounded b-success">Yes</span>`
      : `<span class="badge-rounded b-secondary">No</span>`;

  const badgeStatus = (status: UserResponseDto["user_status"]) => {
    const map: Record<UserResponseDto["user_status"], string> = {
      active: `<span class="badge-rounded b-success">Active</span>`,
      pending: `<span class="badge-rounded b-warning">Pending</span>`,
      suspended: `<span class="badge-rounded b-danger">Suspended</span>`,
      banned: `<span class="badge-rounded b-danger">Banned</span>`,
    };
    return map[status] ?? map.active;
  };

  // 🔹 Destruir instancia de DataTable de forma segura
  function safeDestroyDT() {
    const inst: any = dtRef.current;
    if (!inst) return;
    try {
      inst.destroy();
    } catch {}
    dtRef.current = null;
  }

  // 🔹 Refrescar tras que React pinte el DOM (útil al agregar/eliminar)
  async function safeRefreshDT() {
    await new Promise((r) => setTimeout(r, 0));
    try {
      dtRef.current?.refresh();
    } catch {}
  }

  // Cargar lista
  async function fetchUsers() {
    setLoading(true);
    setErrMsg(null);
    try {
      const res = await api.get("/admin/users/list");
      const data = (res.data ?? []) as UserResponseDto[];
      setUsers(data);
    } catch (err: any) {
      const s = err?.response?.status;
      if (s === 401) {
        setErrMsg("No autenticado. Inicia sesión.");
        router.replace("/login");
      } else if (s === 403) {
        setErrMsg("Acceso denegado. Requiere permisos de administrador.");
      } else if (s === 404) {
        setErrMsg("No hay usuarios registrados.");
      } else {
        setErrMsg("No se pudo obtener la lista de usuarios.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Init
  useEffect(() => {
    void fetchUsers();
    // Cleanup total al desmontar
    return () => {
      safeDestroyDT();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 Inicializar DataTable SOLO cuando:
  // - hay tabla en el DOM
  // - NO hay error
  // - users.length > 0 (ya hay filas pintadas)
  // - y aún NO existe instancia previa
  useEffect(() => {
    if (!tableRef.current || errMsg || users.length === 0) return;
    if (dtRef.current) {
      // Ya está inicializado; solo refrescamos por si cambió algo
      void safeRefreshDT();
      return;
    }

    let cancelled = false;

    (async () => {
      // espera a que React pinte tbody con filas
      await new Promise((r) => setTimeout(r, 0));
      if (cancelled || !tableRef.current) return;

      const { DataTable } = await import("simple-datatables");
      if (cancelled || !tableRef.current) return;

      dtRef.current = new DataTable(tableRef.current, {
        searchable: true,
        fixedHeight: false,
        perPage: 8,
        perPageSelect: [5, 8, 10, 25, 50],
        labels: {
          placeholder: "Buscar…",
          perPage: "entries per page",
          noRows: "Sin datos para mostrar",
          info: "Mostrando {start} a {end} de {rows} entradas",
        },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [users, errMsg]);

  // Auto-ocultar OK
  useEffect(() => {
    if (!okMsg) return;
    const t = setTimeout(() => setOkMsg(null), 3200);
    return () => clearTimeout(t);
  }, [okMsg]);

  // Handlers
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddErr(null);
    setOkMsg(null);

    const name = fName.trim();
    const email = fEmail.trim();
    const password = fPass;
    if (!name || !email || !password) {
      setAddErr("Completa nombre, correo y contraseña.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddErr("Correo inválido.");
      return;
    }

    try {
      setAddLoading(true);
      const res = await api.post("/admin/users", { name, email, password });
      const created: UserResponseDto =
        (res?.data as UserResponseDto) ??
        ({
          id: Math.floor(Math.random() * 1_000_000),
          email,
          is_admin: 1,
          user_status: "active",
          name,
        } as UserResponseDto);

      setUsers((p) => [created, ...p]);
      setOkMsg(`Listo: se registró el administrador "${name}".`);
      setShowAdd(false);
      setFName("");
      setFEmail("");
      setFPass("");
      setErrMsg(null);

      // 🔹 refresca DataTable tras actualizar DOM
      await safeRefreshDT();

      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {}
    } catch (err: any) {
      setAddErr(err?.response?.data?.message || "No se pudo registrar el administrador.");
    } finally {
      setAddLoading(false);
    }
  }

  // Borrado compatible con tu controller actual (@Post("delete")) y fallback DELETE
  async function deleteUserById(idNum: number) {
    // 1) intenta POST body { id } (tu controller actual)
    try {
      await api.post("/admin/users/delete", { id: idNum });
      return;
    } catch (e: any) {
      const s = e?.response?.status;
      if (s !== 404 && s !== 405 && s !== 400) throw e; // si es otro error, re-lanza
    }
    // 2) fallback: DELETE /admin/users/:id
    await api.delete(`/admin/users/${idNum}`);
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDelErr(null);
    setOkMsg(null);

    const idNum = Number(delId.trim());
    if (!Number.isInteger(idNum) || idNum <= 0) {
      setDelErr("ID inválido.");
      return;
    }

    try {
      setDelLoading(true);
      await deleteUserById(idNum);

      setUsers((p) => p.filter((u) => u.id !== idNum));
      setOkMsg(`Usuario ${idNum} eliminado correctamente.`);
      setShowDel(false);
      setErrMsg(null);

      // 🔹 refresca DataTable tras actualizar DOM
      await safeRefreshDT();

      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {}
    } catch (err: any) {
      setDelErr(
        err?.response?.data?.message ||
          "No se pudo eliminar el usuario. Verifica permisos o que el ID exista."
      );
    } finally {
      setDelLoading(false);
    }
  }

  return (
    <div className="container px-4" style={{ maxWidth: "1200px", marginRight: "2rem" }}>
      <style>{`
        .table{font-size:.92rem}.table>:not(caption)>*>*{padding:.4rem .55rem}
        .align-middle td,.align-middle th{vertical-align:middle}
        .dataTable-wrapper,.dataTable-container,.table-responsive{overflow:visible!important}
        th .dataTable-sorter{display:inline-flex;align-items:center;gap:.25rem;cursor:pointer}
        th .dataTable-sorter::after{content:"";border:4px solid transparent;border-top-color:#888;transform:translateY(2px)}
        th .dataTable-sorter.asc::after{border-top-color:#000;transform:rotate(180deg) translateY(2px)}
        th .dataTable-sorter.desc::after{border-top-color:#000}
        .badge-rounded{border-radius:8px;padding:.22em .45em;font-size:.78em;font-weight:500}
        .b-success{background:#d4edda;color:#155724;border:1px solid #c3e6cb}
        .b-secondary{background:#e2e3e5;color:#383d41;border:1px solid #d6d8db}
        .b-warning{background:#fff3cd;color:#856404;border:1px solid #ffeeba}
        .b-danger{background:#f8d7da;color:#721c24;border:1px solid #f5c6cb}
        .modal-backdrop{position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:1050}
        .modal-card{background:#fff; border-radius:12px; width:100%; max-width:520px; box-shadow:0 20px 50px rgba(0,0,0,.25); overflow:hidden}
        .modal-header{padding:.8rem 1rem; border-bottom:1px solid #e9ecef; display:flex; align-items:center; justify-content:space-between}
        .modal-body{padding:1rem}
        .modal-footer{padding:.8rem 1rem; border-top:1px solid #e9ecef; display:flex; gap:.5rem; justify-content:flex-end}
      `}</style>

      <h1 className="mt-4">Usuarios</h1>

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div><i className="fas fa-users me-1" /> Lista de Usuarios</div>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-success" onClick={() => { setAddErr(null); setShowAdd(true); }}>
              <i className="fas fa-user-shield me-1" /> Registrar administrador
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => { setDelErr(null); setShowDel(true); }}>
              <i className="fas fa-user-times me-1" /> Eliminar usuario
            </button>
          </div>
        </div>

        <div className="card-body">
          {loading && <div className="p-3">Cargando usuarios…</div>}
          {errMsg && !loading && <div className="p-3 text-danger">{errMsg}</div>}
          {okMsg && !loading && <div className="p-3 text-success">{okMsg}</div>}

          {!loading && !errMsg && (
            <div className="table-responsive">
              <table
                ref={tableRef}
                id="datatable-users"
                className="table table-sm align-middle"
              >
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Is Admin</th>
                    <th>User Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td dangerouslySetInnerHTML={{ __html: badgeAdmin(u.is_admin ? 1 : 0) }} />
                      <td dangerouslySetInnerHTML={{ __html: badgeStatus(u.user_status) }} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add */}
      {showAdd && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h5 className="m-0"><i className="fas fa-user-shield me-2" />Registrar administrador</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowAdd(false)} disabled={addLoading}>Cerrar</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {addErr && <div className="alert alert-danger py-2">{addErr}</div>}
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input className="form-control" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Nombre completo" disabled={addLoading} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Correo</label>
                  <input type="email" className="form-control" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="email@dominio.com" disabled={addLoading} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Contraseña</label>
                  <input type="password" className="form-control" value={fPass} onChange={(e) => setFPass(e.target.value)} placeholder="••••••••" disabled={addLoading} required minLength={6} />
                </div>
                <small className="text-muted">Se creará con privilegios de administrador.</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAdd(false)} disabled={addLoading}>Cancelar</button>
                <button type="submit" className="btn btn-success" disabled={addLoading}>{addLoading ? "Registrando…" : "Registrar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDel && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h5 className="m-0"><i className="fas fa-user-times me-2" />Eliminar usuario</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowDel(false)} disabled={delLoading}>Cerrar</button>
            </div>
            <form onSubmit={handleDelete}>
              <div className="modal-body">
                {delErr && <div className="alert alert-danger py-2">{delErr}</div>}
                <div className="mb-3">
                  <label className="form-label">ID de usuario</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    className="form-control"
                    value={delId}
                    onChange={(e) => setDelId(e.target.value)}
                    placeholder="Ej. 42"
                    disabled={delLoading}
                    required
                  />
                </div>
                <small className="text-muted">Esta acción es irreversible.</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDel(false)} disabled={delLoading}>Cancelar</button>
                <button type="submit" className="btn btn-danger" disabled={delLoading}>{delLoading ? "Eliminando…" : "Eliminar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
