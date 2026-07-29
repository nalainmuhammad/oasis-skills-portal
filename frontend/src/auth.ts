import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

process.env.AUTH_TRUST_HOST = "true";

export const {
  handlers,
  signIn,
  signOut,
  auth
} = NextAuth({
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      checks: ["state"],
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Credentials (email + password)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          // Replace with real backend call
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          });
          
          if (!res.ok) return null;
          const data = await res.json();
          
          if (data.access_token) {
            // Fetch user profile
            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
              headers: { "Authorization": `Bearer ${data.access_token}` }
            });
            
            if (profileRes.ok) {
              const userProfile = await profileRes.json();
              return {
                id: userProfile.public_id,
                email: userProfile.email,
                name: userProfile.full_name,
                image: userProfile.avatar_url || null,
                role: userProfile.role,
                emailVerified: userProfile.email_verified,
                avatarType: userProfile.avatar_type,
                avatarIcon: userProfile.avatar_icon,
                userType: userProfile.user_type,
                registrationNumber: userProfile.registration_number,
                position: userProfile.position,
                profileCompletionPercentage: userProfile.profile_completion_percentage,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
              };
            }
          }
          return null;
        } catch (e) {
          console.error("Auth error:", e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign-in, exchange Google token for backend JWT
      if (account?.provider === "google") {
        try {
          const idToken = account.id_token;
          if (idToken) {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/auth/google`, {
              method: 'POST',
              body: JSON.stringify({ id_token: idToken }),
              headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
              const data = await res.json();
              
              (user as any).accessToken = data.access_token;
              (user as any).refreshToken = data.refresh_token;

              const profileRes = await fetch(`${apiUrl}/api/auth/me`, {
                headers: { "Authorization": `Bearer ${data.access_token}` }
              });

              if (profileRes.ok) {
                const profile = await profileRes.json();
                const finalImage = profile.avatar_url || user.image;
                (user as any).role = profile.role;
                (user as any).id = profile.public_id;
                (user as any).emailVerified = profile.email_verified;
                (user as any).avatarType = finalImage ? (profile.avatar_type === 'upload' ? 'upload' : 'google') : (profile.avatar_type || 'icon');
                (user as any).avatarIcon = profile.avatar_icon;
                (user as any).userType = profile.user_type;
                (user as any).registrationNumber = profile.registration_number;
                (user as any).position = profile.position;
                (user as any).profileCompletionPercentage = profile.profile_completion_percentage;
                (user as any).image = finalImage;
              } else {
                (user as any).emailVerified = true;
              }
              return true;
            } else {
              console.error("Google backend auth non-200:", await res.text());
              return false;
            }
          }
        } catch (e) {
          console.error("Google auth exchange error:", e);
          return false;
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.id = user.id;
        token.emailVerified = (user as any).emailVerified;
        token.avatarType = (user as any).avatarType;
        token.avatarIcon = (user as any).avatarIcon;
        token.userType = (user as any).userType;
        token.registrationNumber = (user as any).registrationNumber;
        token.position = (user as any).position;
        token.profileCompletionPercentage = (user as any).profileCompletionPercentage;
        token.image = user.image;
      }
      // Handle session updates
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.image = session.image;
        if (session.avatarType) token.avatarType = session.avatarType;
        if (session.avatarIcon) token.avatarIcon = session.avatarIcon;
        if (session.profileCompletionPercentage !== undefined) token.profileCompletionPercentage = session.profileCompletionPercentage;
        if (session.position) token.position = session.position;
        // @ts-ignore
        if (session.emailVerified !== undefined) (token as any).emailVerified = session.emailVerified;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);
        if (urlObj.origin === baseObj.origin) return url;
      } catch (e) {
        // ignore
      }
      return baseUrl;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.image as string;
        // @ts-ignore
        session.user.emailVerified = token.emailVerified as boolean;
        session.user.avatarType = token.avatarType as string;
        session.user.avatarIcon = token.avatarIcon as string;
        (session.user as any).userType = token.userType as string;
        (session.user as any).registrationNumber = token.registrationNumber as string;
        (session.user as any).position = token.position as string;
        (session.user as any).profileCompletionPercentage = token.profileCompletionPercentage as number;
        session.accessToken = token.accessToken as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    newUser: '/register',
    error: '/login',
  },
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
});
