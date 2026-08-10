import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

// ================= CREATE CONTEXT =================
const AuthContext = createContext({});

// ================= PROVIDER =================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW: GLOBAL SAVED STATE
  const [savedIds, setSavedIds] = useState([]);

  // ================= RESTORE SESSION =================
  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Auth restore error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ================= LOGIN =================
  function login(newToken, newUser) {
    if (!newToken || !newUser) return;

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  }

  // ================= LOGOUT =================
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    // 🔥 clear saved state
    setSavedIds([]);
  }

  // ================= GLOBAL DEACTIVATION DETECTION =================
  // Catches the `deactivated: true` flag from ANY API response (not just login) —
  // this is what makes deactivation take effect immediately, without requiring
  // the user to manually log out and log back in.
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403 && error.response?.data?.deactivated) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
          setSavedIds([]);

          if (!window.location.pathname.startsWith("/login")) {
            window.location.href = "/login?deactivated=1";
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  // ================= UPDATE USER (profile picture etc) =================
  function updateUser(updatedUser) {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  }

  // ================= REFRESH USER FROM API =================
const refreshUser = async () => {
  if (!token) return;
  try {
    const res = await axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updatedUser = res.data?.data || res.data?.user;
    if (updatedUser) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  } catch (err) {
    console.error("Failed to refresh user:", err);
  }
};

  // ================= POLL FOR VERIFICATION STATUS CHANGES =================
  // Keeps verification_status in sync app-wide without requiring a logout/login.
  // Only polls while not yet verified — stops automatically once approved,
  // since there's nothing further to catch after that.
  useEffect(() => {
    if (!token || !user || user.verification_status === "verified") return;
    const interval = setInterval(refreshUser, 15000);
    return () => clearInterval(interval);
  }, [token, user?.verification_status]);

  // ================= FETCH SAVED =================
  const fetchSaved = async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${API}/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data?.data || [];

      const ids = data.map((item) => item.listing_id);

      setSavedIds(ids);
    } catch (err) {
      console.error("Failed to fetch saved:", err);
    }
  };

  // ================= LOAD SAVED WHEN TOKEN READY =================
  useEffect(() => {
    if (token) {
      fetchSaved();
    }
  }, [token]);

  // ================= TOGGLE SAVE =================
  const toggleSave = async (listingId) => {
    if (!token) return;

    const isSaved = savedIds.includes(listingId);

    try {
      if (isSaved) {
        await axios.delete(`${API}/save/${listingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSavedIds((prev) =>
          prev.filter((id) => id !== listingId)
        );
      } else {
        await axios.post(
          `${API}/save/${listingId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSavedIds((prev) => [...prev, listingId]);
      }
    } catch (err) {
      console.error("Toggle save failed:", err);
    }
  };

  // ================= DERIVED STATE =================
  const isLoggedIn = Boolean(token);
  const isVerified = user?.verification_status === "verified";
  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoggedIn,
        isVerified,
        role,
        login,
        logout,
        updateUser,
        refreshUser,

        // 🔥 SAVED SYSTEM
        savedIds,
        toggleSave,
        fetchSaved,
        savedCount: savedIds.length,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ================= HOOK =================
export const useAuth = () => useContext(AuthContext);