/* src/lib/auth.ts */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import bcrypt from "bcryptjs";
import { users } from "@/db/schema/identity";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    // Credentials (Email/Password)
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) {
          throw new Error("Email y contraseña requeridos");
        }

        try {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string));

          if (!user.length) {
            throw new Error("Usuario no encontrado");
          }

          const dbUser = user[0];

          if (!dbUser.passwordHash) {
            throw new Error("Este usuario no tiene contraseña configurada");
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            dbUser.passwordHash,
          );

          if (!passwordMatch) {
            throw new Error("Contraseña incorrecta");
          }

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Si el usuario acaba de iniciar sesión
      if (user) {
        token.id = user.id;
      }

      // Si es OAuth y no hay ID en el token, buscarlo en la BD
      if (!token.id && token.email) {
        try {
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.email, token.email));

          if (dbUser.length > 0) {
            token.id = dbUser[0].id;
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
