// FILE: src/pages/LandlordMessages.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, ArrowLeft, MessageCircle, Search, Loader, Home, ChevronRight, Users, Reply, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

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
  const src      = picture ? (picture.startsWith("http") ? picture : STORAGE + picture) : null;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0 border border-green-200`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
        : <span className="text-sm font-bold text-[#3d6b35]">{initials}</span>
      }
    </div>
  );
}

function ListingCardBubble({ msg, navigate }) {
  const l   = msg.listing_card;
  if (!l) return null;
  const img = l.images?.length > 0 ? STORAGE + l.images[0].image_path : l.image ? STORAGE + l.image : null;
  const isMine = msg._isMine;
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div onClick={() => navigate(`/listing/${l.id}`)}
        className="w-56 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm cursor-pointer hover:border-[#3d6b35] hover:shadow-md transition">
        {img && <img src={img} alt={l.title} className="w-full h-32 object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
        <div className="p-3">
          <p className="font-bold text-sm text-gray-900 line-clamp-1 mb-1">{l.title}</p>
          <p className="text-sm font-bold text-[#3d6b35]">
            ₱{Number(l.price).toLocaleString("en-PH")}
            <span className="text-xs text-gray-400 font-normal">/mo</span>
          </p>
          {l.barangay && <p className="text-xs text-gray-400 mt-0.5">{l.barangay}</p>}
          <p className="text-xs text-[#3d6b35] font-semibold mt-2">View listing →</p>
        </div>
      </div>
    </div>
  );
}

export default function LandlordMessages() {
  const navigate        = useNavigate();
  const { token, user } = useAuth();

  const [conversations,  setConversations]  = useState([]);
  const [selectedGroup,  setSelectedGroup]  = useState(null);
  const [selected,       setSelected]       = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [text,           setText]           = useState("");
  const [replyTo,        setReplyTo]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [search,         setSearch]         = useState("");
  const [panel,          setPanel]          = useState("listings");
  const [hoveredMsg,     setHoveredMsg]     = useState(null);

  const messagesEndRef  = useRef(null);
  const msgRefs         = useRef({});
  const [highlighted,   setHighlighted] = useState(null);
  const pollRef        = useRef(null);
  const textareaRef    = useRef(null);
  const headers        = { Authorization: `Bearer ${token}` };

  const [searchParams] = useSearchParams();

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API}/conversations`, { headers });
      setConversations(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConversations(); }, [token]);

  // ✅ Auto-open a specific tenant's conversation when arriving via
  // ?tenant=X&listing=Y (e.g. from the "Message [Tenant]" button on the reservations page)
  useEffect(() => {
    const tenantId = searchParams.get("tenant");
    const listingId = searchParams.get("listing");
    if (!tenantId || conversations.length === 0) return;

    const targetConv = conversations.find((c) =>
      String(c.tenant?.id) === String(tenantId) &&
      (!listingId || String(c.listing?.id) === String(listingId))
    );

    if (targetConv) {
      const group = buildGroups().find((g) => g.convIds.has(targetConv.id));
      if (group) setSelectedGroup(group);
      openConversation(targetConv);
      setPanel("chat");
    } else {
      // No existing conversation with this tenant yet — start one
      axios.post(`${API}/conversation/${tenantId}`, { listing_id: listingId || null }, { headers })
        .then((res) => {
          const newConv = res.data.data;
          setConversations((prev) => [newConv, ...prev]);
          setPanel("chat");
          openConversation(newConv);
        })
        .catch(() => {});
    }
  }, [conversations, searchParams]);

  // ── Group by EACH listing card found across all conversations ──
  const buildGroups = () => {
    const groups = {};

    conversations.forEach((conv) => {
      // ✅ Get all unique listings from listing_message bubbles in this conv
      const listingMsgs = conv.listing_messages || [];
      const seenListings = new Set();

      listingMsgs.forEach((msg) => {
        const l = msg.listing_card;
        if (!l || seenListings.has(l.id)) return;
        seenListings.add(l.id);

        const key = String(l.id);
        if (!groups[key]) {
          groups[key] = { listing: l, listingId: l.id, convIds: new Set(), conversations: [] };
        }
        if (!groups[key].convIds.has(conv.id)) {
          groups[key].convIds.add(conv.id);
          groups[key].conversations.push(conv);
        }
      });

      // Fallback to conv.listing if no listing_messages yet
      if (seenListings.size === 0) {
        const l   = conv.listing;
        const key = l ? String(l.id) : "general";
        if (!groups[key]) {
          groups[key] = { listing: l || null, listingId: l?.id || "general", convIds: new Set(), conversations: [] };
        }
        if (!groups[key].convIds.has(conv.id)) {
          groups[key].convIds.add(conv.id);
          groups[key].conversations.push(conv);
        }
      }
    });

    return Object.values(groups).sort((a, b) => {
      const aTime = Math.max(...a.conversations.map((c) => new Date(c.updated_at)));
      const bTime = Math.max(...b.conversations.map((c) => new Date(c.updated_at)));
      return bTime - aTime;
    });
  };

  const groups = buildGroups();

  const filteredGroups = groups.filter((g) => {
    const listingMatch = (g.listing?.title || "General").toLowerCase().includes(search.toLowerCase());
    const tenantMatch  = g.conversations.some((c) =>
      `${c.tenant?.first_name || ""} ${c.tenant?.last_name || ""}`.toLowerCase().includes(search.toLowerCase())
    );
    return !search || listingMatch || tenantMatch;
  });

  const openConversation = async (conv) => {
    setSelected(conv);
    setPanel("chat");
    setMessages([]);
    setReplyTo(null);
    clearInterval(pollRef.current);

    const loadMsgs = async () => {
      try {
        const res  = await axios.get(`${API}/conversation/${conv.id}/messages`, { headers });
        const raw  = res.data.data?.data || res.data.data || [];
        const msgs = raw.map((m) => ({ ...m, replyTo: m.replyTo || m.reply_to || null, listing_card: m.listing_card || m.listingCard || null }));
        setMessages(msgs);
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
    setText("");
    setSending(true);
    setReplyTo(null);

    setMessages((prev) => [...prev, {
      id: Date.now(), sender_id: user.id, message: msg,
      created_at: new Date().toISOString(), sender: user,
      message_type: 'text',
      reply_to_id: replyId, replyTo: replyId ? replyTo : null,
    }]);

    try {
      await axios.post(`${API}/message`, { conversation_id: selected.id, message: msg, reply_to_id: replyId }, { headers });
      fetchConversations();
    } catch {}
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setReplyTo(null);
  };

  const getListingImg = (listing) => {
    if (!listing) return null;
    if (listing.images?.length > 0) return STORAGE + listing.images[0].image_path;
    if (listing.image) return STORAGE + listing.image;
    return null;
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 overflow-hidden">

      {/* PANEL 1: Listings */}
      <div className={`${panel !== "listings" ? "hidden md:flex" : "flex"} w-full md:w-72 flex-col bg-white border-r border-gray-100`}>
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search listings or tenants..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#3d6b35]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader size={24} className="text-[#3d6b35] animate-spin" /></div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 px-4">
              <MessageCircle size={40} className="mb-3 opacity-30" />
              <p className="font-medium text-sm">No messages yet</p>
              <p className="text-xs mt-1 text-center">Tenants will message you from your listings</p>
            </div>
          ) : filteredGroups.map((group) => {
            const listing  = group.listing;
            const img      = getListingImg(listing);
            const isActive = selectedGroup?.listingId === group.listingId;
            const lastConv = group.conversations[0];
            const lastMsg  = (lastConv?.messages || []).slice(-1)[0];

            return (
              <div key={String(group.listingId)}
                onClick={() => { setSelectedGroup(group); setPanel("convs"); }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 group ${isActive ? "bg-green-50 border-l-4 border-l-[#3d6b35]" : ""}`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  {img
                    ? <img src={img} alt={listing?.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Home size={20} className="text-gray-400" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{listing?.title || "General Inquiry"}</p>
                  <p className="text-[10px] text-[#3d6b35] font-semibold flex items-center gap-1 mb-0.5">
                    <Users size={10} /> {group.conversations.length} tenant{group.conversations.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{lastMsg?.message || "No messages yet"}</p>
                </div>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* PANEL 2: Tenants for selected listing */}
      <div className={`${panel === "convs" ? "flex" : panel === "chat" ? "hidden md:flex" : "hidden md:flex"} w-full md:w-64 flex-col bg-white border-r border-gray-100`}>
        {!selectedGroup ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
            <p className="text-sm text-center">Select a listing</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <button onClick={() => setPanel("listings")} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft size={16} className="text-gray-600" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Listing</p>
                <p className="font-bold text-sm text-gray-900 truncate">{selectedGroup.listing?.title || "General Inquiry"}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedGroup.conversations.map((conv) => {
                const tenant   = conv.tenant;
                const name     = `${tenant?.first_name || ""} ${tenant?.last_name || ""}`.trim();
                const lastMsg  = (conv.messages || []).slice(-1)[0];
                const isActive = selected?.id === conv.id;

                return (
                  <div key={conv.id} onClick={() => openConversation(conv)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 ${isActive ? "bg-green-50 border-l-4 border-l-[#3d6b35]" : ""}`}
                  >
                    <Avatar name={name} picture={tenant?.profile_picture} size="9" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-1">{formatTime(lastMsg?.created_at || conv.updated_at)}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {lastMsg ? (lastMsg.sender_id === user?.id ? `You: ${lastMsg.message}` : lastMsg.message) : "No messages"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* PANEL 3: Chat */}
      <div className={`${panel === "chat" ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Pick a listing then a tenant</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
              <button onClick={() => { setPanel("convs"); setSelected(null); clearInterval(pollRef.current); }}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition">
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              {(() => {
                const tenant = selected.tenant;
                const name   = `${tenant?.first_name || ""} ${tenant?.last_name || ""}`.trim();
                return (
                  <>
                    <Avatar name={name} picture={tenant?.profile_picture} size="10" />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">Tenant</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ✅ Pinned listing card at top of chat */}
            {selected.listing && (() => {
              const l   = selected.listing;
              const img = l.images?.length > 0 ? STORAGE + l.images[0].image_path : l.image ? STORAGE + l.image : null;
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
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Listing</p>
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

                // listing_card standalone messages — skip (handled by pinned header)
                if (msg.message_type === 'listing_card') return null;

                const attachedCard = msg.message_type === 'listing_message'
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
                      {msg.replyTo && (
                        <div onClick={() => scrollToMessage(msg.replyTo.id)}
                          className="px-3 py-1.5 rounded-xl text-xs bg-gray-200 border-l-4 border-[#3d6b35] mb-0.5 max-w-full cursor-pointer hover:bg-gray-300 transition">
                          <p className="font-semibold text-[#3d6b35] text-[10px] mb-0.5">↩ {msg.replyTo.sender?.first_name || "Someone"}</p>
                          <p className="text-gray-600 line-clamp-1">{msg.replyTo.message}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        {isMine && hoveredMsg === msg.id && (
                          <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }}
                            className="p-1.5 text-gray-400 hover:text-[#3d6b35] hover:bg-white rounded-full transition">
                            <Reply size={13} />
                          </button>
                        )}
                        <div className={`rounded-2xl text-sm overflow-hidden transition-all ${isMine ? "bg-[#3d6b35] text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"} ${isHighlighted ? "ring-2 ring-[#3d6b35]/40" : ""}`}>
                          {attachedCard && (() => {
                            const l = attachedCard;
                            const img = l.images?.length > 0 ? STORAGE + l.images[0].image_path : l.image ? STORAGE + l.image : null;
                            return (
                              <div onClick={(e) => { e.stopPropagation(); navigate(`/listing/${l.id}`); }}
                                className={`border-b cursor-pointer hover:opacity-90 transition ${isMine ? "border-white/20" : "border-gray-100"}`}>
                                {img && <img src={img} alt={l.title} className="w-full h-28 object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
                                <div className="px-3 py-2">
                                  <p className={`font-bold text-sm line-clamp-1 ${isMine ? "text-white" : "text-gray-900"}`}>{l.title}</p>
                                  <p className={`text-xs font-bold mt-0.5 ${isMine ? "text-green-200" : "text-[#3d6b35]"}`}>₱{Number(l.price).toLocaleString("en-PH")}/mo</p>
                                  {l.barangay && <p className={`text-[10px] mt-0.5 ${isMine ? "text-white/60" : "text-gray-400"}`}>{l.barangay}</p>}
                                </div>
                              </div>
                            );
                          })()}
                          <div className="px-4 py-2.5">{msg.message}</div>
                        </div>
                        {!isMine && hoveredMsg === msg.id && (
                          <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }}
                            className="p-1.5 text-gray-400 hover:text-[#3d6b35] hover:bg-white rounded-full transition">
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
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                <div className="flex-1 border-l-4 border-[#3d6b35] pl-2 py-1 bg-white rounded-lg">
                  <p className="text-[10px] text-[#3d6b35] font-semibold mb-0.5">Replying to {replyTo.sender?.first_name}</p>
                  <p className="text-xs text-gray-600 line-clamp-1">{replyTo.message}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
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