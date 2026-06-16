"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, Languages, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
};

const CHIP_TRANSLATIONS = {
  en: [
    { label: "B2B Bulk Calculations", query: "Tell me about B2B bulk calculations and wholesale rates." },
    { label: "Bespoke Customization", query: "How do I request a custom bespoke ring design?" },
    { label: "4Cs Diamond Guide", query: "Explain diamond quality and the 4Cs (Carat, Clarity, Color, Cut)." },
    { label: "Call Concierge", query: "What are your contact phone numbers and office hours?" }
  ],
  gu: [
    { label: "જથ્થાબંધ ભાવો (B2B)", query: "મને જથ્થાબંધ હીરા અને બી2બી ભાવો વિશે માહિતી આપો." },
    { label: "કસ્ટમ ડિઝાઇનિંગ", query: "કસ્ટમ રિંગ કેવી રીતે ઓર્ડર કરવી?" },
    { label: "હીરાની ગુણવત્તા (4Cs)", query: "હીરાની ગુણવત્તા (4Cs) એટલે શું?" },
    { label: "ડાયરેક્ટ ફોન કરો", query: "તમારા સંપર્ક નંબરો શું છે?" }
  ]
};

export function AIConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "gu">("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting
  useEffect(() => {
    const greetingText =
      lang === "en"
        ? "Welcome to Zynora Luxe! I am your virtual diamond assistant. How can I assist you with custom ring configurations or bulk wholesale pricing today?"
        : "ઝાયનોરા લક્સમાં આપનું સ્વાગત છે! હું તમારો વર્ચ્યુઅલ ડાયમંડ આસિસ્ટન્ટ છું. આજે હું તમને કસ્ટમ ડિઝાઇન અથવા જથ્થાબંધ હીરાના ખરીદ ભાવો વિશે કેવી રીતે મદદ કરી શકું?";
        
    setMessages([
      {
        id: "greeting",
        sender: "bot",
        text: greetingText,
        timestamp: new Date()
      }
    ]);
  }, [lang]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    try {
      const chatHistory = messages
        .filter((m) => m.id !== "greeting")
        .slice(-6)
        .map((m) => ({
          sender: m.sender,
          text: m.text
        }));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMsg.text,
          history: chatHistory,
          language: lang
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch response.");

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: data.text,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error(err);
      const errorText =
        lang === "en"
          ? "I apologize, but I am experiencing connectivity issues. Please try again or call +91 97246 27122."
          : "હું માફી ચાહું છું, સંપર્ક કનેક્શનમાં ખામી આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો અથવા +91 97246 27122 પર કૉલ કરો.";
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "bot",
          text: errorText,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputVal);
  };

  return (
    <div className="chatbot-trigger flex flex-col items-end">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-[#D6B25E] to-[#C9A24A] text-[#0B0B0C] flex items-center justify-center shadow-[0_8px_30px_rgb(214,178,94,0.3)] border border-[#D6B25E]/40 relative group focus:outline-none"
          >
            <Sparkles size={22} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D6B25E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D6B25E]"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-[calc(100vw-40px)] sm:w-[380px] h-[500px] sm:h-[550px] bg-[#0E0E10]/95 border border-[#D6B25E]/25 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col backdrop-blur-xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-b from-[#18181C] to-[#0E0E10] border-b border-white/5 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D6B25E] to-[#C9A24A] flex items-center justify-center text-[#0B0B0C]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wide">ZYNORA LUXE AI</h3>
                  <p className="text-[10px] text-[#D6B25E] font-medium uppercase tracking-wider">Virtual Diamond Concierge</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Lang Selector toggle in header */}
                <button
                  onClick={() => setLang(lang === "en" ? "gu" : "en")}
                  className="p-1.5 rounded-lg border border-white/10 hover:border-[#D6B25E]/40 text-zinc-400 hover:text-white transition-colors"
                  title="Switch Language"
                >
                  <Languages size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg) => {
                const isBot = msg.sender === "bot";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isBot ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        isBot
                          ? "bg-[#18181C] border border-white/5 text-zinc-300 rounded-tl-sm"
                          : "bg-gradient-to-r from-[#D6B25E] to-[#C9A24A] text-[#0B0B0C] font-medium rounded-tr-sm shadow-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className={`block text-[8px] mt-1.5 text-right ${isBot ? "text-zinc-600" : "text-[#0B0B0C]/60"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Bot typing simulation */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#18181C] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-3">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-white/5 bg-[#0E0E10]/98">
              {CHIP_TRANSLATIONS[lang].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(chip.query)}
                  className="text-[10px] bg-zinc-900 border border-zinc-800 hover:border-[#D6B25E]/40 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-full transition-all"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Footer Input Area */}
            <form onSubmit={handleFormSubmit} className="p-3 bg-[#131316] border-t border-white/5 flex gap-2 items-center">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={lang === "en" ? "Ask about diamonds, B2B wholesale..." : "હીરા અથવા જથ્થાબંધ ભાવો વિશે પૂછો..."}
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-[#D6B25E]/60 focus:outline-none text-xs text-white px-3 py-2.5 rounded-xl transition-all placeholder-zinc-700"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping}
                className="p-2.5 bg-gradient-to-r from-[#D6B25E] to-[#C9A24A] text-[#0B0B0C] rounded-xl hover:from-[#E8C26E] hover:to-[#D6B25E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
