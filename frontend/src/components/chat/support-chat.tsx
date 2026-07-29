"use client";


import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{id: string, role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        
        setMessages([...newMessages, { id: (Date.now() + 1).toString(), role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          assistantContent += decoder.decode(value, { stream: true });
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = assistantContent;
            return updated;
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-oasis-emerald text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,212,126,0.3)] hover:scale-110 transition-all z-50 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open support chat"
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col z-50 transition-all origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-oasis-emerald/20 flex items-center justify-center">
              <Bot size={18} className="text-oasis-emerald" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">OASIS Support</h3>
              <p className="text-xs text-oasis-emerald flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-oasis-emerald inline-block animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-foreground/50 hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="bg-muted border border-border text-foreground px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm leading-relaxed">
                Hi there! 👋 I'm the OASIS Academy AI assistant. How can I help you today?
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-oasis-emerald text-black rounded-tr-sm"
                    : "bg-muted border border-border text-foreground rounded-tl-sm prose prose-sm prose-p:leading-relaxed prose-pre:bg-secondary"
                }`}
              >
                {m.role === "user" ? (
                  m.content
                ) : (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted border border-border text-foreground/50 px-4 py-3 rounded-2xl rounded-tl-sm text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-start">
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl rounded-tl-sm text-sm max-w-[85%]">
                Error: {error.message || "Failed to connect to AI server."}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-muted/50 rounded-b-2xl">
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your question..."
              className="flex-1 bg-background border border-border rounded-full pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-oasis-emerald transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input?.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-oasis-emerald text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-oasis-gold transition-colors"
            >
              <Send size={16} className="mr-0.5" />
            </button>
          </form>
          <div className="text-[10px] text-center text-foreground/40 mt-2">
            AI can make mistakes. Verify important info.
          </div>
        </div>
      </div>
    </>
  );
}
