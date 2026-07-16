"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { CommissionMessage, sendMessage, subscribeToMessages } from "@/lib/firebase/messages";
import { Send } from "lucide-react";

interface CommissionChatProps {
  commissionId: string;
}

export default function CommissionChat({ commissionId }: CommissionChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommissionMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(commissionId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [commissionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;
    
    const text = inputText.trim();
    setInputText("");
    
    try {
      await sendMessage(commissionId, user.uid, text);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border border-white/10 rounded-2xl overflow-hidden min-h-[400px]">
      <div className="p-4 border-b border-white/10 bg-white/5">
        <h3 className="font-bold text-white flex items-center gap-2">
          💬 Commission Chat
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 italic">
            <span className="text-3xl mb-2">👋</span>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/30 rounded-br-none' : 'bg-white/10 text-gray-200 border border-white/10 rounded-bl-none'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/60 flex gap-2">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#00f3ff]/50"
        />
        <button 
          type="submit" 
          disabled={!inputText.trim()}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
