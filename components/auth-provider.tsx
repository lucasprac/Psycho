"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

type UserWithType = User & {
  user_type?: "psicologo" | "paciente"
}

type AuthContextType = {
  user: UserWithType | null
  userType: "psicologo" | "paciente" | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userType: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithType | null>(null)
  const [userType, setUserType] = useState<"psicologo" | "paciente" | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleAuthError = async (error: any) => {
    console.error("Erro de autenticação:", error)
    await signOut()
    return false
  }

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) return await handleAuthError(error)
      return !!data.session
    } catch (error) {
      return await handleAuthError(error)
    }
  }

  const fetchUserType = async (userId: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("Erro ao buscar sessão:", sessionError)
        return null
      }

      // Get user_type from metadata
      const userType = session?.user?.user_metadata?.user_type
      if (userType) {
        return userType as "psicologo" | "paciente"
      }

      // Fallback to database if metadata is not available
      const { data: userData, error } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Erro ao buscar tipo de usuário:", error)
        return null
      }

      return userData.user_type as "psicologo" | "paciente" | null
    } catch (error) {
      console.error("Erro ao buscar tipo de usuário:", error)
      return null
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          await handleAuthError(sessionError)
          setIsLoading(false)
          return
        }

        if (!session) {
          setUser(null)
          setUserType(null)
          setIsLoading(false)
          return
        }

        const userTypeValue = await fetchUserType(session.user.id)

        if (userTypeValue) {
          setUser({ ...session.user, user_type: userTypeValue })
          setUserType(userTypeValue)
        } else {
          console.error("Tipo de usuário não encontrado para:", session.user.id)
          setUser(null)
          setUserType(null)
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        await handleAuthError(error)
        setUser(null)
        setUserType(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const userTypeValue = await fetchUserType(session.user.id)
        if (userTypeValue) {
          setUser({ ...session.user, user_type: userTypeValue })
          setUserType(userTypeValue)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setUserType(null)
        router.push("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserType(null)
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userType, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
