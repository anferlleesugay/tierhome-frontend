// FILE: src/pages/LandlordReports.jsx

import { useState } from "react";
import axios from "axios";
import {
  FileText, Download, Loader, Calendar, Wallet, Building, AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const RANGE_OPTIONS = [
  { value: "this_month", label: "This Month" },
  { value: "this_year",  label: "This Year" },
  { value: "all_time",   label: "All Time" },
];

const REPORTS = [
  {
    key: "reservations",
    icon: Calendar,
    color: "#d97706",
    title: "Reservation & Payment History",
    description: "Every reservation request — tenant details, move-in/move-out dates, status, and payment info. Covers your reservation history, payment history, and tenant records in one file.",
    endpoint: "/landlord/reports/reservations",
  },
  {
    key: "revenue",
    icon: Wallet,
    color: "#7c3aed",
    title: "Revenue Summary",
    description: "Monthly breakdown of paid reservations and total revenue — useful for accounting, tax filing, or annual summaries when set to 'This Year'.",
    endpoint: "/landlord/reports/revenue",
  },
  {
    key: "occupancy",
    icon: Building,
    color: "#0891b2",
    title: "Listings & Occupancy Report",
    description: "A snapshot of every listing you own — occupancy status, verification status, and reservation counts.",
    endpoint: "/landlord/reports/occupancy",
    noRange: true,
  },
];

export default function LandlordReports() {
  const { token } = useAuth();
  const [range, setRange] = useState("this_year");
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);

  const handleDownload = async (report) => {
    setDownloading(report.key);
    setError(null);
    try {
      const url = report.noRange ? report.endpoint : `${report.endpoint}?range=${range}`;
      const res = await axios.get(`${API}${url}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const disposition = res.headers["content-disposition"];
      const match = disposition && disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `${report.key}-report.csv`;

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(`Failed to download ${report.title}. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-16 w-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <FileText size={24} color="#3d6b35" /> Reports
          </h1>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-400 font-medium">Range:</span>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  range === opt.value ? "bg-[#3d6b35] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <p className="text-[13px] text-gray-400">
          Download your records as CSV — opens directly in Excel, Google Sheets, or any spreadsheet app.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {REPORTS.map((report) => {
            const Icon = report.icon;
            const isDownloading = downloading === report.key;
            return (
              <div key={report.key} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: report.color + "18" }}>
                  <Icon size={20} color={report.color} />
                </div>
                <p className="text-[15px] font-bold text-gray-800">{report.title}</p>
                <p className="text-[12.5px] text-gray-400 mt-1.5 flex-1 leading-relaxed">{report.description}</p>
                {report.noRange && (
                  <p className="text-[11px] text-gray-400 italic mt-2">Current snapshot — not affected by the date range above.</p>
                )}
                <button
                  onClick={() => handleDownload(report)}
                  disabled={isDownloading}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: report.color }}
                >
                  {isDownloading ? <Loader size={15} className="animate-spin" /> : <Download size={15} />}
                  {isDownloading ? "Preparing..." : "Download CSV"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-amber-700 leading-relaxed">
            Expense tracking isn't part of TierHome yet, so an expense report isn't available here.
            These reports cover income, occupancy, and reservation/payment history using data
            already in your account.
          </p>
        </div>
      </div>
    </div>
  );
}