import { Outlet, useLocation } from "react-router-dom";

// Navbar components
import Navbar from "../components/navbar/Navbar";
import MobileBottomNav from "../components/navbar/MobileBottomNav";
import ChatbotWidget from "../components/ChatbotWidget";
import PushNotificationHandler from "../components/PushNotificationHandler";
import BackButtonHandler from "../components/BackButtonHandler";
import ExitHintToast from "../components/ExitHintToast";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // ✅ Hide the AI chatbot bubble on actual messaging pages — a floating
  // chat widget competing with the real conversation UI is confusing, not helpful.
  const isMessagesPage = location.pathname.includes("/messages");
  const isWelcomePage = location.pathname === "/" && !isLoggedIn;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* TOP NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT — the single scrollable region; navbar and bottom nav
          stay fixed in place while only this area scrolls */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAV */}
      {!isWelcomePage && <MobileBottomNav />}

      {/* CHATBOT WIDGET — floats on every page under MainLayout except Messages */}
      {!isMessagesPage && <ChatbotWidget />}

      <PushNotificationHandler />
      <BackButtonHandler />
      <ExitHintToast />
    </div>
  );
}