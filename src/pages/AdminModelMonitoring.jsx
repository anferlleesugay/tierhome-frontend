// FILE: src/pages/AdminModelMonitoring.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Activity, RefreshCw, Target, TrendingDown, Gauge,
  Info, CheckCircle2, AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

function SectionHeader({ title }) {
  return <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">{title}</p>;
}

function MetricCard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
          <Icon size={19} color={color} />
        </div>
        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[26px] font-bold text-gray-800 leading-tight">{value ?? "—"}</p>
      {sublabel && <p className="text-[12px] text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function ModelSection({ model }) {
  if (!model) return null;

  const chartData = (model.predictions || []).map((p) => ({
    month: `M${p.month_index + 1}`,
    Actual: p.actual,
    Predicted: p.predicted,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-gray-800">{model.metric_label}</h2>
        {model.sufficient_data ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} /> Sufficient data
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <AlertTriangle size={12} /> Limited data ({model.validation_points_used} points)
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard icon={Target} label="R²" value={model.r_squared ?? "N/A"}
          sublabel="fit vs. mean baseline" color="#3d6b35" />
        <MetricCard icon={TrendingDown} label="RMSE" value={model.rmse ?? "N/A"}
          sublabel="root mean squared error" color="#d97706" />
        <MetricCard icon={Gauge} label="MAE" value={model.mae ?? "N/A"}
          sublabel="mean absolute error" color="#2563eb" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            Not enough historical months yet to run walk-forward validation (need at least 4 months of data).
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Actual" stroke="#3d6b35" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Predicted" stroke="#d97706" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function AdminModelMonitoring() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/model-monitoring`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-16 w-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <Activity size={24} color="#3d6b35" /> Model Monitoring
          </h1>
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-6">

        {/* METHODOLOGY NOTE */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-blue-800 leading-relaxed">
            {data?.methodology || "Walk-forward validation: the model is trained only on months prior to each prediction point (never future months), then evaluated against the actual outcome. This respects the chronological order of time-series data, unlike random k-fold splitting."}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : !data ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-400">Could not load model monitoring data.</p>
          </div>
        ) : (
          <>
            <SectionHeader title="Demand Forecast Model" />
            <ModelSection model={data.demand_forecast_model} />

            <SectionHeader title="Reservation Forecast Model" />
            <ModelSection model={data.reservation_forecast_model} />
          </>
        )}
      </div>
    </div>
  );
}