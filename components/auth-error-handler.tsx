"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { createSupabaseClient } from "@/lib/supabase/client"

export function AuthErrorHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  useEffect(() => {
    const handleAuthError = async () => {
      const error = searchParams.get("error")

      if (error) {
        // Tentar fazer logout para limpar tokens inválidos
        try {
          await supabase.auth.signOut()
        } catch (e) {
          console.error("Erro ao fazer logout:", e)
        }

        const title = "Erro de autenticação"
        let description = "Ocorreu um erro durante a autenticação. Por favor, faça login novamente."

        switch (error) {
          case "session_error":
            description = "Sua sessão expirou ou é inválida. Por favor, faça login novamente."
            break
          case "user_not_found":
            description = "Usuário não encontrado. Por favor, verifique suas credenciais."
            break
          case "auth_error":
            description = "Erro de autenticação. Por favor, faça login novamente."
            break
          case "refresh_token_not_found":
            description = "Sua sessão expirou. Por favor, faça login novamente."
            break
        }

        toast({
          title,
          description,
          variant: "destructive",
        })

        // Remover o parâmetro de erro da URL
        const url = new URL(window.location.href)
        url.searchParams.delete("error")
        router.replace(url.pathname + url.search)
      }
    }

    handleAuthError()
  }, [searchParams, toast, router, supabase])

  return null
}
