import Link from "next/link";
import { Globe, Mail, MessageSquare, Link as LinkIcon } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-oasis-bg border-t border-foreground/5 pt-16 pb-8 relative overflow-hidden">
      {/* Subtle Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-oasis-emerald/30 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-oasis-emerald/5 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-oasis-emerald to-oasis-gold shadow-[0_0_10px_rgba(0,212,126,0.3)]"></div>
              <span className="font-display font-bold text-lg text-foreground tracking-wide">
                OASIS <span className="font-light text-oasis-emerald">Foundation</span>
              </span>
            </Link>
            <p className="text-sm text-oasis-muted mb-6 leading-relaxed max-w-xs">
              Empowering Pakistan's next generation with free, enterprise-grade skills and verified certifications.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-foreground/50 hover:text-oasis-emerald transition-colors">
                <MessageSquare size={20} />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-foreground/50 hover:text-oasis-emerald transition-colors">
                <LinkIcon size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" className="text-foreground/50 hover:text-oasis-emerald transition-colors">
                <Globe size={20} />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="mailto:learn@oasisfoundation.org" className="text-foreground/50 hover:text-oasis-emerald transition-colors">
                <Mail size={20} />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/courses" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/verify" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  My Learning
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">Organization</h3>
            <ul className="space-y-3">
              <li>
                <a href="https://oasisfoundation.net/" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  Main Website
                </a>
              </li>
              <li>
                <a href="https://oasisfoundation.net/#about" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="https://oasisfoundation.net/#mission" target="_blank" rel="noopener noreferrer" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  Our Mission
                </a>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-sm text-foreground/60 hover:text-oasis-emerald transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/40">
            &copy; {currentYear} Oasis Foundation. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-foreground/40">
            <span>Made with</span>
            <span className="text-red-500">♥</span>
            <span>for Pakistan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
