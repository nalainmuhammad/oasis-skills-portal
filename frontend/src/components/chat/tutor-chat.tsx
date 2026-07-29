"use client";


import { MessageCircle, X, Send, Sparkles, BookOpen } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface TutorChatProps {
  courseTitle: string;
  lessonTitle: string;
  lessonContent?: string;
}

export function TutorChat({ courseTitle, lessonTitle, lessonContent }: TutorChatProps) {
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
      const res = await fetch("/api/chat/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages,
          contextData: {
            courseTitle,
            lessonTitle,
            lessonContent
          }
        }),
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating Action Button (Lesson Context) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-[5.5rem] right-6 w-14 h-14 rounded-full bg-oasis-gold text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.3)] hover:scale-110 transition-all z-50 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open AI Tutor"
      >
        <Sparkles size={26} />
      </button>

      {/* Chat Sidebar/Window */}
      <div
        className={`fixed top-20 bottom-6 right-6 w-[380px] max-w-[calc(100vw-3rem)] bg-background border border-border rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col z-50 transition-all origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-oasis-gold/20 flex items-center justify-center">
              <BookOpen size={16} className="text-oasis-gold" />
            </div>
            <div>
              <h3 className="font-medium text-oasis-gold flex items-center gap-2">
                OASIS AI Tutor <Sparkles size={14} />
              </h3>
              <p className="text-xs text-foreground/60 truncate w-48">
                {lessonTitle}
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
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="bg-muted border border-border text-foreground px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm leading-relaxed">
                <p className="mb-2">Hello! I'm your AI Tutor for <strong>{courseTitle}</strong>.</p>
                <p>I can see you're currently working on <em>"{lessonTitle}"</em>. What questions do you have about this material?</p>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-3 rounded-2xl max-w-[90%] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-foreground/10 text-foreground rounded-tr-sm"
                    : "bg-muted border border-border text-foreground rounded-tl-sm prose prose-sm prose-p:leading-relaxed prose-pre:bg-secondary prose-a:text-oasis-gold"
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
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl rounded-tl-sm text-sm max-w-[90%]">
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
              placeholder="Ask about this lesson..."
              className="flex-1 bg-background border border-border rounded-full pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:border-oasis-gold/50 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input?.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-oasis-gold text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ffc833] transition-colors"
            >
              <Send size={16} className="mr-0.5" />
            </button>
          </form>
          <div className="text-[10px] text-center text-foreground/40 mt-2">
            AI Tutor can make mistakes.
          </div>
        </div>
      </div>
    </>
  );
}
