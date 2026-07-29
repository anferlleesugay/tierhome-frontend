import { Outlet } from "react-router-dom";

// Navbar components
import Navbar from "../components/navbar/Navbar";
import MobileBottomNav from "../components/navbar/MobileBottomNav";
import ChatbotWidget from "../components/ChatbotWidget";

export default function MainLayout() {
  return (
    <>
      {/* TOP NAVBAR */}
      <Navbar />

      {/* MAIN CONTENT */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAV */}
      <MobileBottomNav />

      {/* CHATBOT WIDGET — floats on every page under MainLayout */}
      <ChatbotWidget />
    </>
  );
}