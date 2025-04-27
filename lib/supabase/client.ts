"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Supabase client para componentes React (frontend)
 * Usa HTTP-only cookies para armazenar tokens
 * 
 * @returns Uma instância do cliente Supabase configurada para o frontend
 */
export function createSupabaseClient() {
  return createClientComponentClient<Database>({
    cookieOptions: {
      name: 'sb-auth-token',
      domain: '',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
}
