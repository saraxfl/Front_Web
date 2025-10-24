// network/DashboardApi.ts
import { api } from "@/network/axiosConfig";
import type { DashboardStats, Dataset } from "@/types/Dashboard";

// Opcional: traducir estados a etiquetas amigables
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendientes",
  validated: "Aceptados",
  rejected: "Rechazados",
  deleted: "Eliminados",
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [area, byCategory, byStatus, publishRatio]: Dataset[] = await Promise.all([
    api.get("/admin/reports/incidents-by-month").then((r) => r.data),
    api.get("/admin/reports/by-category").then((r) => r.data),
    api.get("/admin/reports/by-status").then((r) => {
      // Mapeo opcional de etiquetas (si tu backend devuelve 'pending','validated','rejected')
      const labels = r.data.labels.map((k: string) => STATUS_LABELS[k] ?? k);
      return { labels, data: r.data.data };
    }),
    api.get("/admin//publish-ratio").then((r) => r.data),
  ]);

  return {
    area,
    bar: byCategory,
    pieStatus: byStatus,
    piePublished: publishRatio,
  };
}
