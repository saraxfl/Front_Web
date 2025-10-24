"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/network/DashboardApi";
import type { DashboardStats } from "../../types/Dashboard";

// chart.js + react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fallback: DashboardStats = {
    area: {
      labels: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio"],
      data: [50, 70, 40, 85, 60, 90, 120],
    },
    bar: {
      labels: ["Phishing", "Malware", "Fraude", "Suplantación", "Otros"],
      data: [20, 35, 15, 25, 10],
    },
    pieStatus: {
      labels: ["Aceptados", "Pendientes", "Rechazados"],
      data: [45, 25, 30],
    },
    piePublished: {
      labels: ["Publicados", "No publicados"],
      data: [60, 40],
    },
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        setStats(fallback);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !stats) return <div className="p-6">Cargando dashboard…</div>;

  const areaData = {
    labels: stats.area.labels,
    datasets: [
      {
        label: "Incidentes detectados",
        data: stats.area.data,
        fill: true,
        borderColor: "#455a64",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const barData = {
    labels: stats.bar.labels,
    datasets: [
      {
        label: "Casos",
        backgroundColor: "#CBD5E1",
        data: stats.bar.data,
      },
    ],
  };

  const pieStatus = {
    labels: stats.pieStatus.labels,
    datasets: [
      {
        data: stats.pieStatus.data,
        backgroundColor: ["#F3F4F6", "#3B82F6", "#1E3A8A"],
      },
    ],
  };

  const piePublished = {
    labels: stats.piePublished.labels,
    datasets: [
      {
        data: stats.piePublished.data,
        backgroundColor: ["#93C5FD", "#F3F4F6"],
      },
    ],
  };

  return (
    <div className="container px-4" style={{ maxWidth: "1200px", marginRight: "2rem" }}>
      <h1 className="mt-4">Dashboard</h1>

      <div className="row">
        {/* Área */}
        <div className="col-xl-6 col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#455a64" }}>
              Actividad de Incidentes
            </div>
            <div className="card-body">
              <Line data={areaData} />
            </div>
          </div>
        </div>

        {/* Barras */}
        <div className="col-xl-6 col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#455a64" }}>
              Casos por tipo
            </div>
            <div className="card-body">
              <Bar data={barData} />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Pastel 1 */}
        <div className="col-xl-6 col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#455a64" }}>
              Estado de Incidentes
            </div>
            <div className="card-body">
              <Pie data={pieStatus} height={200} />
            </div>
          </div>
        </div>

        {/* Pastel 2 */}
        <div className="col-xl-6 col-lg-6 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#455a64" }}>
              Publicaciones
            </div>
            <div className="card-body">
              <Pie data={piePublished} height={200} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
