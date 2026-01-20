"use client";

import { memo } from "react";
import { MessageSquare, X } from "lucide-react";
import type { ChatMessage } from "../types";

interface ChatOverlayProps {
  messages: ChatMessage[];
  onDismiss: (id: string) => void;
}

function ChatOverlay({ messages, onDismiss }: ChatOverlayProps) {
  return (
    <div
      className="fixed bottom-24 left-4 z-40 flex flex-col gap-2 max-w-sm"
      style={{ fontFamily: "'PolySans Trial', sans-serif" }}
    >
      {messages.slice(-3).map((message) => (
        <div
          key={message.id}
          className="bg-[#0d0e0d]/95 backdrop-blur-md border border-[#FEFCD9]/10 rounded-xl shadow-2xl p-3 animate-in slide-in-from-left-full duration-300"
        >
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-[#F95F4A] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] uppercase tracking-[0.12em] text-[#F95F4A]/80 truncate"
                style={{ fontFamily: "'PolySans Mono', monospace" }}
              >
                {message.displayName}
              </p>
              <p className="text-xs text-[#FEFCD9]/90 break-words leading-relaxed mt-0.5">
                {message.content}
              </p>
            </div>
            <button
              onClick={() => onDismiss(message.id)}
              className="p-0.5 text-[#FEFCD9]/30 hover:text-[#FEFCD9]/60 hover:bg-[#FEFCD9]/10 rounded transition-all shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(ChatOverlay);
