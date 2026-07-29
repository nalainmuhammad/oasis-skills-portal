"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Phone, CreditCard, Calendar, School } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("male");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cnicNumber, setCnicNumber] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/register`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_type: "member",
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          gender,
          date_of_birth: dob || null,
          email,
          phone_number: phoneNumber,
          cnic_number: cnicNumber,
          institution_name: institutionName || null,
          password
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || data.message || "Failed to register. Please try again.");
        return;
      }

      const data = await res.json();
      router.push(`/verify-email?email=${encodeURIComponent(email)}&reg=${encodeURIComponent(data.registration_number || '')}`);
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Sign-Up Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 h-12 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-200 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isGoogleLoading ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        ) : (
          <GoogleIcon />
        )}
        {isGoogleLoading ? "Connecting..." : "Continue with Google"}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-foreground/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-oasis-bgSecondary px-3 text-foreground/40 font-medium">or fill registration details below</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">First Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Muhammad"
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Last Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Ali"
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Gender & DOB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Gender *</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 transition-colors"
            >
              <option value="male" className="bg-oasis-bgSecondary text-foreground">Male</option>
              <option value="female" className="bg-oasis-bgSecondary text-foreground">Female</option>
              <option value="other" className="bg-oasis-bgSecondary text-foreground">Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Date of Birth *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="+92 300 1234567"
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* CNIC / B-Form Number & Institution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">CNIC / B-Form Number *</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                value={cnicNumber}
                onChange={(e) => setCnicNumber(e.target.value)}
                required
                placeholder="35202-1234567-1"
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Institution / School (Optional)</label>
            <div className="relative">
              <School className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="University of Lahore"
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Password *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-12 text-foreground focus:outline-none focus:border-oasis-emerald/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-foreground/40">Minimum 8 characters.</p>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 pt-2">
          <input id="terms" type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-foreground/20 bg-foreground/5 text-oasis-emerald focus:ring-oasis-emerald/50" />
          <label htmlFor="terms" className="text-xs text-foreground/60">
            I agree to the <Link href="/terms" className="text-oasis-emerald hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-oasis-emerald hover:underline">Privacy Policy</Link>.
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold h-12 rounded-xl mt-4 shadow-lg shadow-oasis-emerald/20 disabled:opacity-50"
        >
          {isLoading ? "Creating Account..." : "Create Oasis Account"} <ArrowRight className="ml-2" size={16} />
        </Button>
      </form>
    </div>
  );
}
