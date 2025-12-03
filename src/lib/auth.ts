// DEPRECATED: This file is no longer used
// The application now uses Supabase Auth instead of NextAuth
// For authentication, import from @/lib/auth instead

import { NextAuthOptions } from "next-auth";

/**
 * @deprecated NextAuth is no longer used. Use Supabase Auth from @/lib/auth instead
 */
export const authOptions: NextAuthOptions = {
  providers: [],
  // Add your auth configuration here
};