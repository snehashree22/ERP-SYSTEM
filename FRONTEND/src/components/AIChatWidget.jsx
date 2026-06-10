import { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { FaBrain } from "react-icons/fa";
import { MdClose, MdSend, MdSmartToy } from "react-icons/md";

// ── Static quick-prompts ─────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "Which products are low on stock?",
  "What is the total revenue this month?",
  "How many customers do we have?",
  "Which category has the most products?",
];

function AIChatWidget() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I'm your ERP AI Assistant. Ask me anything about your inventory, sales, customers, or revenue!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { question });
      setMessages((prev) => [...prev, { role: "assistant", text: res.data.answer }]);
    } catch (err) {
      let errMsg = "⚠️ AI service is not connected yet. Set up the Gemini API key in the backend to enable this feature.";
      if (err.response) {
        if (err.response.status === 401) {
          errMsg = "⚠️ Your login session has expired. Please log out and log back in to reactivate the AI.";
        } else if (err.response.data && err.response.data.detail) {
          errMsg = `⚠️ AI Error: ${err.response.data.detail}`;
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: errMsg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <button
        id="ai-chat-toggle"
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 ${
          open ? "bg-gray-700 rotate-90" : "bg-[#7C3AED] hover:bg-purple-700 hover:scale-110"
        }`}
        title="AI Assistant"
      >
        {open ? <MdClose size={24} /> : <FaBrain size={22} />}
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-[#7C3AED] animate-ping opacity-30" />
        )}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: "520px" }}>

          {/* Header */}
          <div className="bg-[#0F0A25] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-xl flex items-center justify-center text-white">
              <MdSmartToy size={18} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">ERP AI Assistant</p>
              <p className="text-gray-500 text-[10px]">Powered by Gemini AI</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-gray-500 hover:text-white transition">
              <MdClose size={18} />
            </button>
          </div>

          {/* Quick prompts */}
          <div className="px-3 py-2 border-b bg-gray-50 flex gap-1.5 overflow-x-auto">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="flex-shrink-0 text-[10px] bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full hover:bg-purple-100 transition whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs mr-2 mt-1 flex-shrink-0">
                    AI
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#7C3AED] text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs mr-2 mt-1">
                  AI
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t bg-white flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about your ERP data..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 bg-[#7C3AED] hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition"
            >
              <MdSend size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChatWidget;
