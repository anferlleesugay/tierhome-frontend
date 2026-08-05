import { useState, useEffect } from "react";

export default function ExitHintToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("tierhome:back-to-exit-hint", handler);
    return () => window.removeEventListener("tierhome:back-to-exit-hint", handler);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900/90 text-white text-sm px-4 py-2.5 rounded-full shadow-lg pointer-events-none animate-in fade-in"
      style={{ animation: "fadeIn 0.2s ease-out" }}
    >
      Press back again to exit
    </div>
  );
}
