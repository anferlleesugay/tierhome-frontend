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
    <>
      {/* TOP NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAV */}
      {!isWelcomePage && <MobileBottomNav />}

      {/* CHATBOT WIDGET — floats on every page under MainLayout except Messages */}
      {!isMessagesPage && <ChatbotWidget />}

      <PushNotificationHandler />
      <BackButtonHandler />
      <ExitHintToast />
    </>
  );
}