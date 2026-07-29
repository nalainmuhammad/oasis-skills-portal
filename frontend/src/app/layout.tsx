import type { Metadata } from "next";
import { Inter, Outfit, Space_Grotesk } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { Preloader } from "@/components/ui/preloader";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { GsapAnimations } from "@/components/ui/gsap-animations";
import { SupportChat } from "@/components/chat/support-chat";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | OASIS Skills & Certification",
    default: "OASIS Skills & Certification | Free Online Courses",
  },
  description: "Master new skills and earn verified certificates with the Oasis Foundation's free, high-performance learning platform.",
  openGraph: {
    title: "OASIS Skills & Certification",
    description: "Master new skills and earn verified certificates with the Oasis Foundation.",
    siteName: "OASIS Platform",
    images: [
      {
        url: "https://oasisfoundation.net/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} ${spaceGrotesk.variable} antialiased min-h-screen bg-oasis-bg text-foreground flex flex-col font-body selection:bg-oasis-emerald/30`}
      >
        <GsapAnimations />
        <CustomCursor />
        <Preloader />
        <Providers>
          <TooltipProvider>
            <Navbar />
            <main className="flex-1 flex flex-col pt-20">
              {children}
            </main>
            <Footer />
            <SupportChat />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
