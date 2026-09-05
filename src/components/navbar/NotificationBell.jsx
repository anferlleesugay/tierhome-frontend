import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, CheckCircle, XCircle, MessageCircle, Home, Ban, Building, ShieldCheck, Star, Wrench } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const ICON_MAP = {
  new_reservation:            { icon: Home,          color: "#2563eb" },
  listing_pending_review:     { icon: Building,      color: "#d97706" },
  verification_pending_review:{ icon: ShieldCheck,   color: "#d97706" },
  amenity_request_pending:    { icon: Star,          color: "#d97706" },
  reservation_approved:  { icon: CheckCircle,   color: "#3d6b35" },
  reservation_rejected:  { icon: XCircle,       color: "#ef4444" },
  reservation_cancelled: { icon: Ban,           color: "#6b7280" },
  new_message:           { icon: MessageCircle, color: "#2563eb" },
  listing_approved:      { icon: Home,          color: "#3d6b35" },
  listing_rejected:      { icon: Home,          color: "#ef4444" },
  maintenance_request_submitted: { icon: Wrench, color: "#dc2626" },
  maintenance_request_updated:   { icon: Wrench, color: "#2563eb" },
};

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { token, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.unread_count || 0);
    } catch {}
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchNotifications();

    // ✅ Poll every 30s while the tab is actually visible/focused — no point
    // hitting the endpoint on a schedule if the admin has switched tabs or
    // minimized the window. Also does one immediate fetch the moment the
    // tab becomes visible again, so returning to it doesn't feel stale.
    let interval = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(fetchNotifications, 30000);
    };
    const stopPolling = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn, token]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNotificationClick = async (n) => {
    if (!n.read_at) {
      try {
        await axios.put(`${API}/notifications/${n.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch {}
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition"
        aria-label="Notifications"
      >
        <Bell size={19} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[320px] max-h-[420px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 flex flex-col">

          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between shrink-0">
            <p className="font-bold text-sm text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-semibold text-[#3d6b35] hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = ICON_MAP[n.type] || { icon: Bell, color: "#6b7280" };
                const Icon = cfg.icon;
                const isUnread = !n.read_at;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition ${
                      isUnread ? "bg-green-50/40" : ""
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: cfg.color + "15" }}
                    >
                      <Icon size={15} color={cfg.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#3d6b35] shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}