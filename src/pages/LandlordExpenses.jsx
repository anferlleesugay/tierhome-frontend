// FILE: src/pages/LandlordExpenses.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Receipt, Plus, Trash2, X, Loader, Wallet, TrendingDown, TrendingUp, RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const CATEGORIES = ["Repairs", "Utilities", "Taxes", "Insurance", "Management Fees", "Supplies", "Other"];

const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

export default function LandlordExpenses() {
  const { token } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [listings, setListings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    listing_id: "", category: "Repairs", amount: "", description: "", expense_date: new Date().toISOString().split("T")[0],
  });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [expRes, listRes, sumRes] = await Promise.all([
        axios.get(`${API}/landlord/expenses`, { headers }),
        axios.get(`${API}/my-listings`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API}/landlord/expenses-summary?range=this_year`, { headers }),
      ]);
      setExpenses(expRes.data?.data || []);
      setListings(listRes.data?.data?.data || []);
      setSummary(sumRes.data?.data || null);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchAll(); }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.listing_id || !form.amount) return;
    setSaving(true);
    try {
      await axios.post(`${API}/landlord/expenses`, form, { headers });
      setForm({ listing_id: "", category: "Repairs", amount: "", description: "", expense_date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      fetchAll();
    } catch {
      // stays open on failure
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await axios.delete(`${API}/landlord/expenses/${id}`, { headers });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      fetchAll();
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-16 w-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <Receipt size={24} color="#3d6b35" /> Expenses
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={fetchAll} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#3d6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5525] transition"
            >
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-6">

        {/* NET INCOME SUMMARY — directly answers Client 2's profitability question */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
              <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} /><p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Revenue (This Year)</p></div>
              <p className="text-[24px] font-bold">{formatPeso(summary.total_revenue)}</p>
            </div>
            <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}>
              <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} /><p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Expenses (This Year)</p></div>
              <p className="text-[24px] font-bold">{formatPeso(summary.total_expenses)}</p>
            </div>
            <div className="rounded-2xl p-5 text-white" style={{ background: summary.net_income >= 0 ? "linear-gradient(135deg, #3d6b35, #2d5a27)" : "linear-gradient(135deg, #7c2d12, #5c2410)" }}>
              <div className="flex items-center gap-2 mb-2"><Wallet size={16} /><p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Net Income</p></div>
              <p className="text-[24px] font-bold">{formatPeso(summary.net_income)}</p>
            </div>
          </div>
        )}

        {/* EXPENSE LIST */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No expenses logged yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13.5px] font-semibold text-gray-800">{exp.category}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">{exp.listing?.title || "—"}</span>
                    </div>
                    {exp.description && <p className="text-[12px] text-gray-400 mt-0.5">{exp.description}</p>}
                  </div>
                  <p className="text-[12px] text-gray-400 shrink-0">{exp.expense_date}</p>
                  <p className="text-[15px] font-bold text-red-600 shrink-0 w-24 text-right">{formatPeso(exp.amount)}</p>
                  <button onClick={() => handleDelete(exp.id)} disabled={deletingId === exp.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition shrink-0">
                    {deletingId === exp.id ? <Loader size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add Expense</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
              <select value={form.listing_id} onChange={(e) => setForm({ ...form, listing_id: e.target.value })} required
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition">
                <option value="">Select listing...</option>
                {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>

              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Amount (PHP)" required
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition" />

              <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition" />

              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                placeholder="Description (optional)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition resize-none" />

              <button type="submit" disabled={saving} className="w-full py-2.5 bg-[#3d6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5525] transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                {saving ? "Saving..." : "Add Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}