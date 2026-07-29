import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageCircle, X, Send, Loader, Sparkles } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const WELCOME_MESSAGE = {
  role: "bot",
  text: "Hi! I'm the TierHome assistant. Ask me about registering, identity verification, affordability ranking, listings, or reservations.",
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await axios.post(`${API}/chatbot/message`, { message: text });
      const reply = res.data?.data?.response || "Sorry, I couldn't process that. Please try again.";
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Sorry, something went wrong. Please try again in a moment." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-[#3d6b35] text-white shadow-lg hover:bg-[#2d5525] transition flex items-center justify-center"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm h-[28rem] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-[#3d6b35] text-white px-4 py-3 flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">TierHome Assistant</p>
              <p className="text-[11px] text-white/70 leading-tight">Ask me anything about TierHome</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-[#3d6b35] text-white rounded-br-sm"
                      : "bg-white text-gray-700 border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1.5">
                  <Loader size={13} className="animate-spin text-gray-400" />
                  <span className="text-xs text-gray-400">Typing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-2.5 flex items-end gap-2 shrink-0 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              rows={1}
              disabled={sending}
              className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition max-h-24 disabled:opacity-60"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="w-9 h-9 shrink-0 rounded-xl bg-[#3d6b35] text-white flex items-center justify-center hover:bg-[#2d5525] transition disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}