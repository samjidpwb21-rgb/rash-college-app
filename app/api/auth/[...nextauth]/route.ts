// ============================================================================
// CAMPUSTRACK - NEXTAUTH API ROUTE
// ============================================================================
// Handles all /api/auth/* requests (login, logout, session, etc.)

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-options"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
