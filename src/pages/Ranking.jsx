// FILE: src/pages/Ranking.jsx
// UPDATED: Merged Monthly Utility Costs into Monthly Expenses (single field)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calculator, CheckCircle,
  AlertCircle, XCircle, Wallet,
  TrendingUp, PiggyBank, ArrowRight,
  RefreshCw, AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ListingCard from "../components/listings/ListingCard";
import SkeletonCard from "../components/listings/SkeletonCard";

const API = import.meta.env.VITE_API_URL;

const formatPeso = (val) => {
  const num = String(val).replace(/\D/g, "");
  return num ? Number(num).toLocaleString() : "";
};

const parsePeso = (val) =>
  Number(String(val).replace(/,/g, "")) || 0;

const displayPeso = (num) =>
  "₱" + Number(num || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// ================================================
// PESO INPUT
// ================================================
function PesoInput({ label, sublabel, value, onChange }) {
  return (
    <div className="flex flex-col h-full">
      <label className="block text-[12px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
        {label}
      </label>
      <p className="text-[11px] text-gray-400 mb-1.5 min-h-[28px] leading-snug">
        {sublabel || ""}
      </p>
      <div className="relative mt-auto">
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold"
          style={{ color: "#3d6b35" }}
        >
          ₱
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(formatPeso(e.target.value))}
          placeholder="0"
          className="w-full h-[52px] bg-[#f8fafc] border border-gray-200 rounded-xl pl-9 pr-4 text-[15px] font-semibold text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10"
        />
      </div>
    </div>
  );
}

// ================================================
// SUMMARY CARD
// ================================================
function SummaryCard({ label, amount, sublabel, color, icon: Icon }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: color + "15", border: `1.5px solid ${color}30` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: color + "20" }}
        >
          <Icon size={14} color={color} />
        </div>
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-[22px] font-bold" style={{ color }}>
        {displayPeso(amount)}
      </p>
      {sublabel && (
        <p className="text-[11px] text-gray-400">{sublabel}</p>
      )}
    </div>
  );
}

// ================================================
// TIER HEADER
// ================================================
function TierHeader({ tier, count }) {
  const config = {
    "Highly Affordable": {
      color: "#3d6b35",
      bg: "#f0fdf4",
      border: "#86efac",
      icon: CheckCircle,
      desc: "Within your budget and savings cover move-in costs.",
    },
    "Moderately Affordable": {
      color: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
      icon: AlertCircle,
      desc: "Manageable but may stretch your budget or savings.",
    },
    "Financially Risky": {
      color: "#ef4444",
      bg: "#fef2f2",
      border: "#fecaca",
      icon: XCircle,
      desc: "Exceeds your recommended budget. Proceed with caution.",
    },
  };

  const c = config[tier];
  if (!c) return null;
  const TierIcon = c.icon;

  return (
    <div
      className="rounded-2xl px-5 py-4 mb-4 flex items-start gap-3"
      style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
    >
      <TierIcon size={20} color={c.color} className="shrink-0 mt-0.5" />
      <div>
        <p className="text-[14px] font-bold" style={{ color: c.color }}>
          {tier}
          <span className="ml-2 text-[12px] font-semibold opacity-70">
            ({count} {count === 1 ? "listing" : "listings"})
          </span>
        </p>
        <p className="text-[12px] text-gray-500 mt-0.5">{c.desc}</p>
      </div>
    </div>
  );
}

// ================================================
// VALIDATION FUNCTION
// ================================================
function validateFinancialInput(grossIncome, expenses, savings) {
  const warnings = [];

  const gi = parsePeso(grossIncome);
  const exp = parsePeso(expenses);
  const sav = parsePeso(savings);

  // Warning 1: Expenses exceed income
  if (exp > gi) {
    warnings.push({
      type: "error",
      message: "Your monthly expenses exceed your gross income. Please review your entries.",
    });
  }

  // Warning 2: Very low expenses for high income (possible underreporting)
  if (gi >= 50000 && exp < 5000) {
    warnings.push({
      type: "warning",
      message: "Your reported expenses seem very low for your income level. Did you include groceries, transportation, loans, utilities, SSS, PhilHealth, and other deductions?",
    });
  }

  // Warning 3: Very high income with low expenses (unrealistic)
  if (gi >= 100000 && exp < 10000) {
    warnings.push({
      type: "warning",
      message: "Your financial profile suggests very high income with minimal expenses. Please verify this is accurate.",
    });
  }

  // Warning 4: Negative disposable income
  const disposable = gi - exp;
  if (disposable < 0) {
    warnings.push({
      type: "error",
      message: "Your disposable income is negative (expenses exceed income). Please review and correct your entries.",
    });
  }

  // Warning 5: Savings seem unusually high
  if (sav > gi * 12) {
    warnings.push({
      type: "warning",
      message: "Your available savings exceed a year's gross income. Please confirm this amount is accurate.",
    });
  }

  // Warning 6: No savings but high rent affordability
  if (sav === 0 && disposable > 0) {
    warnings.push({
      type: "warning",
      message: "You have no savings for move-in costs. Even if a property fits your monthly budget, you may not afford the initial 3-month deposit.",
    });
  }

  return warnings;
}

// ================================================
// MAIN PAGE
// ================================================
export default function Ranking() {
  const navigate = useNavigate();
  const { token, isLoggedIn, loading: authLoading } = useAuth();

  const [grossIncome, setGrossIncome] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [availableSavings, setAvailableSavings] = useState("");

  const [computed, setComputed] = useState(null);
  const [rankedListings, setRankedListings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, authLoading, navigate]);

  if (authLoading) return null;

  // Live formula preview + validation
  const gi = parsePeso(grossIncome);
  const me = parsePeso(monthlyExpenses);
  const disposablePreview = Math.max(0, gi - me);
  const maxRentPreview = disposablePreview * 0.3;

  // Update warnings as user types
  useEffect(() => {
    if (grossIncome || monthlyExpenses || availableSavings) {
      const warnings = validateFinancialInput(
        grossIncome,
        monthlyExpenses,
        availableSavings
      );
      setValidationWarnings(warnings);
    } else {
      setValidationWarnings([]);
    }
  }, [grossIncome, monthlyExpenses, availableSavings]);

  const handleSubmit = async () => {
    if (!gi || me === undefined || parsePeso(availableSavings) === undefined) {
      setError("Please fill in all fields.");
      return;
    }
    if (gi <= 0) {
      setError("Gross income must be greater than zero.");
      return;
    }

    setSubmitting(true);
    setError("");
    setComputed(null);
    setRankedListings([]);

    try {
      const res = await axios.post(
        `${API}/ranking`,
        {
          gross_income: gi,
          monthly_expenses: me,
          available_savings: parsePeso(availableSavings),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Backend returns:
      // { inputs, computed: { disposable_income, recommended_max_rent }, ranked_listings }
      const data = res.data;
      const computedData = data?.computed || data?.data?.computed || {};
      const ranked = data?.ranked_listings || data?.data?.ranked_listings || [];

      setComputed({
        disposable_income: computedData.disposable_income || disposablePreview,
        recommended_max_rent: computedData.recommended_max_rent || maxRentPreview,
        available_savings: parsePeso(availableSavings),
      });

      // ranked_listings comes from backend already sorted with tier
      // Each item: { listing: {...}, tier: '...', rent: ..., move_in_cost: ... }
      setRankedListings(Array.isArray(ranked) ? ranked : []);

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to compute ranking. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Group by tier
  const byTier = (tier) =>
    rankedListings
      .filter((item) => item.tier === tier)
      .map((item) => ({
        ...item.listing,
        tier:            item.tier,
        move_in_cost:    item.move_in_cost,
        composite_score: item.composite_score,
      }));

  const highlyAffordable = byTier("Highly Affordable");
  const moderatelyAffordable = byTier("Moderately Affordable");
  const financiallyRisky = byTier("Financially Risky");

  // Check if there are any error warnings (not just info)
  const hasErrors = validationWarnings.some(w => w.type === "error");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-5 md:px-10 py-6">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#f0fdf4" }}
            >
              <Calculator size={18} style={{ color: "#3d6b35" }} />
            </div>
            <h1 className="text-[22px] font-bold text-gray-900">
              Affordability Ranking
            </h1>
          </div>
          <p className="text-[13px] text-gray-500 ml-12">
            Enter your financial details to see which listings you can afford
          </p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-5 md:px-10 pt-6">

        {/* INPUT FORM */}
        <div
          className="bg-white rounded-2xl p-6 mb-6"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Wallet size={18} style={{ color: "#3d6b35" }} />
            <h2 className="text-[16px] font-bold text-gray-800">
              Your Financial Information
            </h2>
          </div>

          {/* GUIDANCE NOTE */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-[12px] text-blue-900">
            <p className="font-semibold mb-2.5">📋 Please enter your actual monthly income and expenses.</p>
            <p className="text-[11px] mb-2">The affordability recommendations are based on your input. Remember:</p>
            <div className="space-y-1.5 ml-2 text-[11px]">
              <p><span className="font-semibold">Gross Income</span> = Before tax/deductions</p>
              <p><span className="font-semibold">Expenses</span> = Actual costs (groceries, transportation, loans, utilities like electricity/water/internet, SSS, PhilHealth, Pag-IBIG, etc.)</p>
              <p><span className="font-semibold">Savings</span> = Realistic amount available for move-in</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <PesoInput
              label="Gross Monthly Income"
              sublabel="Your total salary before deductions"
              value={grossIncome}
              onChange={setGrossIncome}
            />
            <PesoInput
              label="Monthly Expenses"
              sublabel="Food, transportation, bills, loans, utilities, SSS, PhilHealth, Pag-IBIG, etc."
              value={monthlyExpenses}
              onChange={setMonthlyExpenses}
            />
            <PesoInput
              label="Available Savings"
              sublabel="Total savings for move-in costs"
              value={availableSavings}
              onChange={setAvailableSavings}
            />
          </div>

          {/*  VALIDATION WARNINGS */}
          {validationWarnings.length > 0 && (
            <div className="mb-4 space-y-2">
              {validationWarnings.map((warning, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-xl px-4 py-3 border text-[12px]`}
                  style={{
                    background: warning.type === "error" ? "#fef2f2" : "#fffbeb",
                    border: `1px solid ${warning.type === "error" ? "#fecaca" : "#fde68a"}`,
                    color: warning.type === "error" ? "#7f1d1d" : "#92400e",
                  }}
                >
                  <AlertTriangle
                    size={14}
                    className="shrink-0 mt-0.5"
                    color={warning.type === "error" ? "#ef4444" : "#d97706"}
                  />
                  <span>{warning.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* FORMULA PREVIEW */}
          {gi > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-[12px] text-gray-500 space-y-1.5 border border-gray-100">
              <p className="font-bold text-gray-700 mb-2 text-[13px]">
                Formula Preview
              </p>
              <div className="flex items-center justify-between">
                <span>Disposable Income</span>
                <span className="font-bold" style={{ color: "#3d6b35" }}>
                  {displayPeso(disposablePreview)}
                </span>
              </div>
              <div className="text-[11px] text-gray-400">
                = {displayPeso(gi)} − {displayPeso(me)}
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between">
                <span>Max Recommended Rent (30%)</span>
                <span className="font-bold text-blue-600">
                  {displayPeso(maxRentPreview)}
                </span>
              </div>
              <div className="text-[11px] text-gray-400">
                = 30% × {displayPeso(disposablePreview)}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[12px] px-4 py-3 rounded-xl mb-4">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* CONFIRMATION CHECKBOX */}
          <div className="flex items-start gap-3 mb-5 p-3 rounded-xl bg-gray-50 border border-gray-200">
            <input
              type="checkbox"
              id="confirmAccuracy"
              checked={confirmAccuracy}
              onChange={(e) => setConfirmAccuracy(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35] focus:ring-offset-0 cursor-pointer mt-0.5"
              style={{ accentColor: "#3d6b35" }}
            />
            <label
              htmlFor="confirmAccuracy"
              className="text-[12px] text-gray-700 cursor-pointer flex-1 select-none"
            >
              <span className="font-semibold">I confirm that my financial information is accurate and complete.</span>
              <p className="text-[11px] text-gray-500 mt-1">
                The affordability recommendations depend on accurate data. By checking this, you confirm that the information you provided is truthful.
              </p>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || hasErrors || !confirmAccuracy}
            className="w-full h-[52px] rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background: submitting || hasErrors || !confirmAccuracy
                ? "#86a886"
                : "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)",
              boxShadow: submitting || hasErrors || !confirmAccuracy
                ? "none"
                : "0 4px 15px rgba(61,107,53,0.35)",
              cursor: submitting || hasErrors || !confirmAccuracy ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Computing...
              </>
            ) : (
              <>
                <Calculator size={16} />
                Calculate My Affordability
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* INFO ABOUT WARNINGS */}
          {validationWarnings.length > 0 && (
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              ℹ️ Please review the warnings above. Click "Calculate" to proceed if you're confident your data is accurate.
            </p>
          )}
        </div>

        {/* RESULTS */}
        {computed && (
          <>
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <SummaryCard
                label="Disposable Income"
                amount={computed.disposable_income}
                sublabel="After expenses (incl. utilities)"
                color="#3d6b35"
                icon={TrendingUp}
              />
              <SummaryCard
                label="Max Recommended Rent"
                amount={computed.recommended_max_rent}
                sublabel="30% of disposable income"
                color="#2563eb"
                icon={Wallet}
              />
              <SummaryCard
                label="Available Savings"
                amount={computed.available_savings}
                sublabel="For move-in costs"
                color="#7c3aed"
                icon={PiggyBank}
              />
            </div>

            {/* RA 9653 INFO */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-8 flex items-start gap-3">
              <AlertCircle size={18} color="#d97706" className="shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-amber-800 mb-1">
                  About Move-in Costs (RA 9653)
                </p>
                <p className="text-[12px] text-amber-700">
                  Landlords may require up to 2 months deposit plus
                  1 month advance payment. Estimated move-in cost =
                  Monthly Rent × 3.
                </p>
              </div>
            </div>

            {/* NO LISTINGS */}
            {rankedListings.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl">
                <p className="text-gray-500 mb-3">
                  No verified listings available right now.
                </p>
                <button
                  onClick={() => navigate("/browse")}
                  className="text-primary font-semibold hover:underline"
                >
                  Browse all listings →
                </button>
              </div>
            )}

            {/* RANKED LISTINGS */}
            {rankedListings.length > 0 && (
              <div className="space-y-10">

                {highlyAffordable.length > 0 && (
                  <div>
                    <TierHeader tier="Highly Affordable" count={highlyAffordable.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {highlyAffordable.map((listing, idx) => (
                        <div key={listing.id} className="flex flex-col">
                          <ListingCard listing={listing} showTier={true} />
                          <div className="mt-2 flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-[#3d6b35]">#{idx + 1} in tier</span>
                            <span className="text-[11px] font-bold bg-green-50 text-[#3d6b35] border border-green-200 px-2.5 py-1 rounded-full">
                              Affordability Score: {Math.round((listing.composite_score || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {moderatelyAffordable.length > 0 && (
                  <div>
                    <TierHeader tier="Moderately Affordable" count={moderatelyAffordable.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {moderatelyAffordable.map((listing, idx) => (
                        <div key={listing.id} className="flex flex-col">
                          <ListingCard listing={listing} showTier={true} />
                          <div className="mt-2 flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-amber-700">#{idx + 1} in tier</span>
                            <span className="text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                              Affordability Score: {Math.round((listing.composite_score || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {financiallyRisky.length > 0 && (
                  <div>
                    <TierHeader tier="Financially Risky" count={financiallyRisky.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {financiallyRisky.map((listing, idx) => (
                        <div key={listing.id} className="flex flex-col">
                          <ListingCard listing={listing} showTier={true} />
                          <div className="mt-2 flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-red-600">#{idx + 1} in tier</span>
                            <span className="text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">
                              Affordability Score: {Math.round((listing.composite_score || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}