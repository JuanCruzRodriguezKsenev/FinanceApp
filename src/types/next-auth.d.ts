import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extendemos la sesión para que incluya el ID del usuario
   * y sea reconocido en toda la app sin usar 'as string'
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Extendemos el JWT para incluir el ID */
  interface JWT {
    id: string;
  }
}
