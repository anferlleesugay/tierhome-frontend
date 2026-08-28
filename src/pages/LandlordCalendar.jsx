// FILE: src/pages/LandlordCalendar.jsx

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, LogIn, LogOut, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toDateKey(d) {
  // local-date key (YYYY-MM-DD), avoids timezone shift issues from toISOString()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function LandlordCalendar() {
  const { token } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/landlord-reservations`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setReservations(res.data?.data || []))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, [token]);

  // Map each date key -> { checkIns: [...], checkOuts: [...] }, only for approved reservations
  const eventsByDay = useMemo(() => {
    const map = {};
    reservations
      .filter((r) => r.status === "approved")
      .forEach((r) => {
        if (r.move_in_date) {
          const key = r.move_in_date.split("T")[0];
          if (!map[key]) map[key] = { checkIns: [], checkOuts: [] };
          map[key].checkIns.push(r);
        }
        if (r.move_out_date) {
          const key = r.move_out_date.split("T")[0];
          if (!map[key]) map[key] = { checkIns: [], checkOuts: [] };
          map[key].checkOuts.push(r);
        }
      });
    return map;
  }, [reservations]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const todayKey = toDateKey(new Date());
  const selectedEvents = selectedDay ? eventsByDay[toDateKey(selectedDay)] : null;

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon size={24} color="#3d6b35" /> Calendar
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
              <ChevronLeft size={18} />
            </button>
            <p className="text-[14px] font-semibold text-gray-700 w-36 text-center">{MONTH_NAMES[month]} {year}</p>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
              <ChevronRight size={18} />
            </button>
            <button onClick={() => setViewDate(new Date())} className="ml-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
              Today
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6">
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Move-in</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Move-out</span>
        </div>

        {loading ? (
          <div className="h-96 bg-white rounded-2xl animate-pulse border border-gray-100" />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date, i) => {
                if (!date) return <div key={i} className="min-h-[90px] border-b border-r border-gray-50" />;
                const key = toDateKey(date);
                const events = eventsByDay[key];
                const isToday = key === todayKey;
                return (
                  <button
                    key={i}
                    onClick={() => events && setSelectedDay(date)}
                    className={`min-h-[90px] border-b border-r border-gray-50 p-2 text-left transition ${
                      events ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-semibold ${
                      isToday ? "bg-[#3d6b35] text-white" : "text-gray-600"
                    }`}>
                      {date.getDate()}
                    </span>
                    {events && (
                      <div className="mt-1.5 space-y-1">
                        {events.checkIns.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold bg-blue-50 rounded px-1.5 py-0.5">
                            <LogIn size={9} /> {events.checkIns.length} in
                          </div>
                        )}
                        {events.checkOuts.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 rounded px-1.5 py-0.5">
                            <LogOut size={9} /> {events.checkOuts.length} out
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* DAY DETAIL MODAL */}
      {selectedDay && selectedEvents && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => setSelectedDay(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">
                {MONTH_NAMES[selectedDay.getMonth()]} {selectedDay.getDate()}, {selectedDay.getFullYear()}
              </h2>
              <button onClick={() => setSelectedDay(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {selectedEvents.checkIns.map((r) => (
                <div key={`in-${r.id}`} className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                  <LogIn size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{r.tenant?.first_name} {r.tenant?.last_name} — Moving In</p>
                    <p className="text-[11px] text-gray-500">{r.listing?.title}</p>
                  </div>
                </div>
              ))}
              {selectedEvents.checkOuts.map((r) => (
                <div key={`out-${r.id}`} className="flex items-center gap-3 bg-amber-50 rounded-xl p-3">
                  <LogOut size={16} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{r.tenant?.first_name} {r.tenant?.last_name} — Moving Out</p>
                    <p className="text-[11px] text-gray-500">{r.listing?.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}