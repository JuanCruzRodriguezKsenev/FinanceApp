/* src/app/api/auth/[...nextauth]/route.ts */
import { handlers } from "@/lib/auth";

// Exportamos los métodos GET y POST que maneja Auth.js
// Esto crea automáticamente las rutas /api/auth/signin, /api/auth/signout, etc.
export const { GET, POST } = handlers;
