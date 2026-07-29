import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen pt-24 pb-12">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="glass-card rounded-3xl p-8 md:p-10 border border-foreground/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-oasis-emerald/20 rounded-full blur-[50px] -z-10"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-oasis-gold/10 rounded-full blur-[50px] -z-10"></div>
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome Back</h1>
              <p className="text-oasis-muted text-sm">Sign in to continue your learning journey.</p>
            </div>
            
            <Suspense fallback={
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-2 border-oasis-emerald/30 border-t-oasis-emerald rounded-full animate-spin"></div>
              </div>
            }>
              <LoginForm />
            </Suspense>
          </div>
          
          <p className="text-center mt-8 text-foreground/60 text-sm">
            Don't have an account? <Link href="/register" className="text-oasis-emerald font-medium hover:underline">Create one for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
