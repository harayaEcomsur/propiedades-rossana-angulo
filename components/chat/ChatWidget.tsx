"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { ChatMarkdown } from "./ChatMarkdown";

function messageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export function ChatWidget({ businessName, stacked }: { businessName: string; stacked?: boolean }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) });
  const isLoading = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className={`fixed right-4 z-50 ${stacked ? "bottom-24" : "bottom-4"} sm:right-6`}>
      {open && (
        <div className="mb-3 flex h-[28rem] w-[20rem] flex-col overflow-hidden rounded-2xl border border-black/10 bg-background shadow-2xl sm:w-[22rem]">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <span className="font-heading text-sm font-semibold">{businessName}</span>
            <button onClick={() => setOpen(false)} aria-label="Cerrar chat" className="-m-2 p-2">
              <X size={20} />
            </button>
          </div>
          {/* 15px con interlineado amplio: el chat se lee mucho en celular. */}
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 text-[15px] leading-relaxed">
            {messages.length === 0 && <p className="text-foreground/75">¡Hola! ¿En qué te puedo ayudar hoy?</p>}
            {messages.map((m) => {
              const text = messageText(m.parts);
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    m.role === "user" ? "ml-auto bg-primary text-white" : "bg-black/5 text-foreground"
                  }`}
                >
                  {m.role === "user" ? text : <ChatMarkdown content={text} />}
                </div>
              );
            })}
            {isLoading && <p className="text-sm text-foreground/65">Escribiendo…</p>}
          </div>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-black/10 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje…"
              aria-label="Mensaje"
              // 16px: con menos, iOS hace zoom automático al enfocar el campo.
              className="min-h-10 flex-1 rounded-full border border-black/15 px-3 py-2 text-base outline-none focus:border-primary"
            />
            <button type="submit" aria-label="Enviar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <Send size={17} />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-95"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
