// FILE: src/pages/Messages.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Send, ArrowLeft, MessageCircle, Search, Trash2, Loader, Home, Reply, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

const formatTime = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const diff  = new Date() - date;
  if (diff < 60000)    return "Just now";
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

function Avatar({ name, picture, size = "10" }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const src = picture ? (picture.startsWith("http") ? picture : STORAGE + picture) : null;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0 border border-green-200`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
        : <span className="text-sm font-bold text-[#3d6b35]">{initials}</span>
      }
    </div>
  );
}

export default function Messages() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const { token, user } = useAuth();

  const [conversations,   setConversations]   = useState([]);
  const [selected,        setSelected]        = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [text,            setText]            = useState("");
  const [replyTo,         setReplyTo]         = useState(null);
  const [attachedListing, setAttachedListing] = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [sending,         setSending]         = useState(false);
  const [search,          setSearch]          = useState("");
  const [showChat,        setShowChat]        = useState(false);
  const [hoveredMsg,      setHoveredMsg]      = useState(null);
  const [highlighted,     setHighlighted]     = useState(null);

  const messagesEndRef  = useRef(null);
  const msgRefs         = useRef({});
  const pollRef         = useRef(null);
  const textareaRef     = useRef(null);
  const headers         = { Authorization: `Bearer ${token}` };

  const normalizeMsg = (msg) => ({
    ...msg,
    replyTo:      msg.replyTo      || msg.reply_to    || null,
    listing_card: msg.listing_card || msg.listingCard || null,
  });

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API}/conversations`, { headers });
      return res.data.data || [];
    } catch { return []; }
  };

  const loadConversations = async () => {
    const data = await fetchConversations();
    setConversations(data);
    setLoading(false);
    return data;
  };

  useEffect(() => { loadConversations(); }, [token]);

  useEffect(() => {
    const landlordId = searchParams.get("landlord");
    const listingId  = searchParams.get("listing");
    if (!landlordId) return;

    const start = async () => {
      const body = listingId ? { listing_id: Number(listingId) } : {};
      try {
        await axios.post(`${API}/conversation/${landlordId}`, body, { headers });
      } catch (e) {
        console.error("Failed to start conversation:", e.response?.data || e.message);
      }
      const data = await loadConversations();
      const conv = data.find((c) => String(c.landlord_id) === String(landlordId));
      if (conv) {
        openConversation(conv);
        if (conv.listing) setAttachedListing(conv.listing);
      }
    };
    start();
  }, [searchParams.get("landlord"), searchParams.get("listing")]);

  const openConversation = async (conv) => {
    setSelected(conv);
    setShowChat(true);
    setMessages([]);
    setReplyTo(null);
    setAttachedListing(null);
    clearInterval(pollRef.current);

    const loadMsgs = async () => {
      try {
        const res  = await axios.get(`${API}/conversation/${conv.id}/messages`, { headers });
        const raw  = res.data.data?.data || res.data.data || [];
        setMessages(raw.map(normalizeMsg));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } catch {}
    };
    await loadMsgs();
    pollRef.current = setInterval(loadMsgs, 3000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const scrollToMessage = (msgId) => {
    const el = msgRefs.current[msgId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlighted(msgId);
    setTimeout(() => setHighlighted(null), 2000);
  };

  const handleSend = async () => {
    if (!text.trim() || !selected || sending) return;
    const msg     = text.trim();
    const replyId = replyTo?.id || null;
    const listing = attachedListing;
    setText("");
    setSending(true);
    setReplyTo(null);
    setAttachedListing(null);

    setMessages((prev) => [...prev, normalizeMsg({
      id: `temp-${Date.now()}`, sender_id: user.id, message: msg,
      created_at: new Date().toISOString(), sender: user,
      message_type: listing ? "listing_message" : "text",
      reply_to_id: replyId, replyTo: replyId ? replyTo : null,
      listing_card: listing || null,
    })]);

    try {
      await axios.post(`${API}/message`, {
        conversation_id: selected.id,
        message:         msg,
        reply_to_id:     replyId,
        listing_card_id: listing?.id || null,
        message_type:    listing ? "listing_message" : "text",
      }, { headers });
      loadConversations();
    } catch {}
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setReplyTo(null);
  };

  const handleDelete = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await axios.delete(`${API}/conversation/${convId}`, { headers });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selected?.id === convId) { setSelected(null); setShowChat(false); }
    } catch {}
  };

  const getOther = (conv) => user?.id === conv.tenant_id ? conv.landlord : conv.tenant;
  const lastMsg  = (conv) => (conv.messages || []).slice(-1)[0] || null;
  const getImg   = (l) => {
    if (!l) return null;
    if (l.images?.length > 0) return STORAGE + l.images[0].image_path;
    if (l.image) return STORAGE + l.image;
    return null;
  };

  const filtered = conversations.filter((c) => {
    const other = getOther(c);
    const name  = `${other?.first_name || ""} ${other?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (c.listing?.title || "").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">

      {/* LEFT: Conversation List */}
      <div className={`${showChat ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 flex-col bg-white border-r border-gray-100`}>
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#3d6b35]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={24} className="text-[#3d6b35] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 px-4">
              <MessageCircle size={40} className="mb-3 opacity-30" />
              <p className="font-medium text-sm">No conversations yet</p>
              <p className="text-xs mt-1 text-center">Click "Message Property Owner" from a listing</p>
            </div>
          ) : filtered.map((conv) => {
            const other    = getOther(conv);
            const last     = lastMsg(conv);
            const isActive = selected?.id === conv.id;
            const name     = `${other?.first_name || ""} ${other?.last_name || ""}`.trim();
            return (
              <div key={conv.id} onClick={() => openConversation(conv)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 group ${isActive ? "bg-green-50 border-l-4 border-l-[#3d6b35]" : ""}`}>
                <Avatar name={name} picture={other?.profile_picture} size="11" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatTime(last?.created_at || conv.updated_at)}</span>
                  </div>
                  {conv.listing && (
                    <p className="text-[10px] text-[#3d6b35] font-semibold truncate flex items-center gap-1 mb-0.5">
                      <Home size={9} /> {conv.listing.title}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 truncate">
                    {last
                      ? last.message_type === "listing_card"
                        ? "📷 Sent a listing"
                        : last.sender_id === user?.id
                          ? `You: ${last.message}`
                          : last.message
                      : "No messages yet"}
                  </p>
                </div>
                <button onClick={(e) => handleDelete(conv.id, e)}
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Chat */}
      <div className={`${showChat ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
              <button onClick={() => { setShowChat(false); setSelected(null); clearInterval(pollRef.current); }}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition">
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              {(() => {
                const other = getOther(selected);
                const name  = `${other?.first_name || ""} ${other?.last_name || ""}`.trim();
                return (
                  <>
                    <Avatar name={name} picture={other?.profile_picture} size="10" />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">{other?.role === "landlord" ? "Property Owner" : other?.role === "tenant" ? "Tenant" : other?.role}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Pinned listing card */}
            {selected.listing && (() => {
              const l   = selected.listing;
              const img = getImg(l);
              return (
                <div onClick={() => navigate(`/listing/${l.id}`)}
                  className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition group">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    {img
                      ? <img src={img} alt={l.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                      : <div className="w-full h-full flex items-center justify-center"><Home size={18} className="text-gray-300" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Inquiring about</p>
                    <p className="font-bold text-sm text-gray-900 truncate">{l.title}</p>
                    <p className="text-sm font-bold text-[#3d6b35]">
                      ₱{Number(l.price).toLocaleString("en-PH")}
                      <span className="text-xs text-gray-400 font-normal">/mo</span>
                    </p>
                  </div>
                  <span className="text-xs text-[#3d6b35] font-semibold shrink-0 group-hover:underline">View →</span>
                </div>
              );
            })()}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 bg-gray-50">
              {messages.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">No messages yet. Say hello! 👋</p>
              )}

              {messages.map((msg) => {
                const isMine        = msg.sender_id === user?.id;
                const isHighlighted = highlighted === msg.id;

                if (msg.message_type === "listing_card") return null;

                const attachedCard = msg.message_type === "listing_message"
                  ? (msg.listing_card || null) : null;

                return (
                  <div key={msg.id}
                    ref={(el) => { msgRefs.current[msg.id] = el; }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2 group transition-all duration-500 ${isHighlighted ? "bg-green-100 rounded-2xl px-2 py-1 -mx-2" : ""}`}
                    onMouseEnter={() => setHoveredMsg(msg.id)}
                    onMouseLeave={() => setHoveredMsg(null)}
                  >
                    {!isMine && (
                      <Avatar name={`${msg.sender?.first_name || ""} ${msg.sender?.last_name || ""}`}
                        picture={msg.sender?.profile_picture} size="7" />
                    )}

                    <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>

                      {/* Reply quote */}
                      {msg.replyTo && (
                        <div onClick={() => scrollToMessage(msg.replyTo.id)}
                          className="px-3 py-1.5 rounded-xl text-xs bg-gray-200 border-l-4 border-[#3d6b35] mb-0.5 max-w-full cursor-pointer hover:bg-gray-300 transition">
                          <p className="font-semibold text-[#3d6b35] text-[10px] mb-0.5">↩ {msg.replyTo.sender?.first_name || "Someone"}</p>
                          <p className="text-gray-600 line-clamp-1">{msg.replyTo.message}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        {isMine && (
                          <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }}
                            className={`p-1.5 text-gray-400 hover:text-[#3d6b35] hover:bg-white rounded-full transition-opacity opacity-100 md:opacity-0 ${hoveredMsg === msg.id ? "md:opacity-100" : ""}`}>
                            <Reply size={13} />
                          </button>
                        )}

                        {/* Combined bubble: listing card + message text */}
                        <div className={`rounded-2xl text-sm overflow-hidden transition-all ${
                          isMine
                            ? "bg-[#3d6b35] text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                        } ${isHighlighted ? "ring-2 ring-[#3d6b35]/40" : ""}`}>

                          {attachedCard && (() => {
                            const l   = attachedCard;
                            const img = getImg(l);
                            return (
                              <div onClick={(e) => { e.stopPropagation(); navigate(`/listing/${l.id}`); }}
                                className={`border-b cursor-pointer hover:opacity-90 transition ${isMine ? "border-white/20" : "border-gray-100"}`}>
                                {img && <img src={img} alt={l.title} className="w-full h-28 object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
                                <div className="px-3 py-2">
                                  <p className={`font-bold text-sm line-clamp-1 ${isMine ? "text-white" : "text-gray-900"}`}>{l.title}</p>
                                  <p className={`text-xs font-bold mt-0.5 ${isMine ? "text-green-200" : "text-[#3d6b35]"}`}>
                                    ₱{Number(l.price).toLocaleString("en-PH")}/mo
                                  </p>
                                  {l.barangay && <p className={`text-[10px] mt-0.5 ${isMine ? "text-white/60" : "text-gray-400"}`}>{l.barangay}</p>}
                                </div>
                              </div>
                            );
                          })()}

                          <div className="px-4 py-2.5">{msg.message}</div>
                        </div>

                        {!isMine && (
                          <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }}
                            className={`p-1.5 text-gray-400 hover:text-[#3d6b35] hover:bg-white rounded-full transition-opacity opacity-100 md:opacity-0 ${hoveredMsg === msg.id ? "md:opacity-100" : ""}`}>
                            <Reply size={13} />
                          </button>
                        )}
                      </div>

                      <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply preview */}
            {replyTo && (
              <div className="px-4 py-2 bg-white border-t border-gray-200 flex items-center gap-2">
                <div className="flex-1 border-l-4 border-[#3d6b35] pl-2 py-1 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-[#3d6b35] font-semibold mb-0.5">↩ Replying to {replyTo.sender?.first_name}</p>
                  <p className="text-xs text-gray-600 line-clamp-1">{replyTo.message}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Attached listing preview */}
            {attachedListing && (
              <div className="px-4 pt-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                  {getImg(attachedListing) && (
                    <img src={getImg(attachedListing)} alt={attachedListing.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Attached listing</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{attachedListing.title}</p>
                    <p className="text-xs font-bold text-[#3d6b35]">₱{Number(attachedListing.price).toLocaleString("en-PH")}/mo</p>
                  </div>
                  <button onClick={() => setAttachedListing(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0">
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-100">
              <div className="flex items-end gap-2">
                <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="Write a message..." rows={1}
                  className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition max-h-32"
                  style={{ minHeight: "44px" }} />
                <button onClick={handleSend} disabled={!text.trim() || sending}
                  className="w-11 h-11 rounded-2xl bg-[#3d6b35] text-white flex items-center justify-center hover:bg-[#2d5525] transition disabled:opacity-40 shrink-0">
                  {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-center">Enter to send · Shift+Enter for new line</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}