"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-12 bg-oasis-bg bg-[url('/grid.svg')] bg-center">
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        
        <div className="w-full max-w-md glass-card p-8 rounded-2xl border border-foreground/5 relative overflow-hidden shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-oasis-emerald/10 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-oasis-gold/10 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">Reset Password</h1>
            <p className="text-sm text-foreground/60">
              {isSubmitted 
                ? "Check your email for reset instructions." 
                : "Enter your email address and we'll send you a link to reset your password."}
            </p>
          </div>

          {isSubmitted ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-oasis-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-oasis-emerald/30">
                <Send className="text-oasis-emerald" size={24} />
              </div>
              <p className="text-foreground/80 text-sm">
                If an account exists for <span className="text-foreground font-medium">{email}</span>, you will receive password reset instructions.
              </p>
              <div className="pt-4">
                <Link href="/login" className="inline-flex items-center justify-center h-12 px-8 bg-foreground/10 hover:bg-foreground/20 text-foreground font-medium rounded-xl transition-colors w-full">
                  <ArrowLeft className="mr-2" size={16} /> Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading || !email}
                className="w-full bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold h-12 rounded-xl mt-4 shadow-[0_0_15px_rgba(0,212,126,0.2)] disabled:opacity-50"
              >
                {isLoading ? "Sending Link..." : "Send Reset Link"}
              </Button>

              <div className="pt-4 text-center">
                <Link href="/login" className="inline-flex items-center text-sm text-foreground/40 hover:text-foreground transition-colors">
                  <ArrowLeft className="mr-2" size={14} /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
        
      </div>
    </div>
  );
}
