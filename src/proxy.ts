import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Next.js 16 Proxy (Middleware)
 *
 * Ejecuta la lógica de protección de rutas definida en authConfig.callbacks.authorized
 * Al usar session: "jwt", verifica el token sin consultar la DB en cada request.
 */
export default NextAuth(authConfig).auth;

export const config = {
  // Proteger solo las rutas específicas que requieren autenticación
  matcher: ["/", "/finanzas/:path*", "/patrimonio/:path*", "/auth/:path*"],
};
