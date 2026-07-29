"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, RotateCcw, Mail } from "lucide-react";
import Link from "next/link";

function OtpVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const email = searchParams.get("email") || session?.user?.email || "";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start cooldown on mount
  useEffect(() => {
    setResendCooldown(60);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only last digit
    setOtp(newOtp);
    setError("");

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newOtp.every(d => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.oasisportal.tech';
      const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ email, otp: otpCode }),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || data.message || "Invalid verification code. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess(true);

      // If user is currently logged in, update session
      if (session) {
        await update({ emailVerified: true });
        setTimeout(() => {
          router.push("/dashboard?verified=true");
          router.refresh();
        }, 1500);
      } else {
        // Redirect to login page with success message
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 1500);
      }

    } catch (err: any) {
      setError(err.message || "Unable to connect to authentication server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.oasisportal.tech';
      const res = await fetch(`${apiUrl}/api/auth/resend-otp`, {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.message || "Failed to resend code.");
      }

      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="flex flex-col min-h-screen pt-24 pb-12">
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-foreground/60 mb-4">No email address provided.</p>
            <Link href="/register" className="text-oasis-emerald hover:underline">Go to registration</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-12">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-3xl p-8 md:p-10 border border-foreground/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-oasis-emerald/20 rounded-full blur-[50px] -z-10"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-oasis-cyan/10 rounded-full blur-[50px] -z-10"></div>
            
            {success ? (
              // Success State
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-oasis-emerald/20 flex items-center justify-center">
                  <ShieldCheck size={40} className="text-oasis-emerald" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Email Verified!</h1>
                <p className="text-oasis-muted text-sm mb-6">Your email has been verified successfully. Redirecting to login...</p>
                <div className="w-8 h-8 mx-auto border-2 border-oasis-emerald/30 border-t-oasis-emerald rounded-full animate-spin"></div>
              </div>
            ) : (
              // OTP Input State
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-oasis-emerald/10 flex items-center justify-center">
                    <Mail size={28} className="text-oasis-emerald" />
                  </div>
                  <h1 className="text-3xl font-display font-bold text-foreground mb-2">Verify Your Email</h1>
                  <p className="text-oasis-muted text-sm">
                    We&apos;ve sent a 6-digit code to
                  </p>
                  <p className="text-oasis-emerald font-medium text-sm mt-1">{email}</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">
                    {error}
                  </div>
                )}

                {/* OTP Input Boxes */}
                <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-2xl font-display font-bold rounded-xl border-2 transition-all focus:outline-none ${
                        digit 
                          ? "bg-oasis-emerald/10 border-oasis-emerald/50 text-foreground" 
                          : "bg-foreground/5 border-foreground/10 text-foreground focus:border-oasis-emerald/50 focus:bg-foreground/10"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={() => handleVerify()}
                  disabled={isLoading || otp.some(d => d === "")}
                  className="w-full bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold h-12 rounded-xl shadow-[0_0_15px_rgba(0,212,126,0.2)] disabled:opacity-50 mb-4"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>Verify Email <ArrowRight className="ml-2" size={16} /></>
                  )}
                </Button>

                {/* Resend */}
                <div className="text-center">
                  <p className="text-foreground/40 text-sm mb-2">Didn&apos;t receive the code?</p>
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isResending}
                    className="inline-flex items-center gap-2 text-sm text-oasis-emerald hover:text-oasis-emeraldLight disabled:text-foreground/30 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw size={14} className={isResending ? "animate-spin" : ""} />
                    {resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s` 
                      : isResending 
                        ? "Sending..." 
                        : "Resend Code"
                    }
                  </button>
                </div>

                <p className="text-center text-foreground/40 text-xs mt-6">
                  Check your spam folder if you don&apos;t see the email.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen pt-24 pb-12">
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-8 h-8 rounded-full border-2 border-oasis-emerald/30 border-t-oasis-emerald animate-spin"></div>
        </div>
      </div>
    }>
      <OtpVerificationContent />
    </Suspense>
  );
}
