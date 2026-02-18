/* src/lib/auth.config.ts */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isOnDashboard =
        nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/finanzas") ||
        nextUrl.pathname.startsWith("/patrimonio");

      const isOnAuth = nextUrl.pathname.startsWith("/auth");

      // Proteger rutas del dashboard
      if (isOnDashboard) {
        return isLoggedIn;
      }

      // Redirigir a home si ya está logueado e intenta ir a /auth
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
