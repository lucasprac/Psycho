"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createSupabaseClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseClient> | null>(null)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    console.log("Initializing Supabase client...")
    const client = createSupabaseClient()
    console.log("Supabase client initialized:", client)
    setSupabase(client)

    // Check for existing session
    client.auth.getSession().then(({ data: { session } }) => {
      console.log("Existing session:", session)
      if (session) {
        setSession(session)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", { event: _event, session })
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Handle redirect after session is set
  useEffect(() => {
    if (session?.user) {
      console.log("Session detected, checking user type...")
      const userType = session.user.user_metadata.user_type
      if (userType) {
        console.log("Redirecting based on user type:", userType)
        const redirectPath = userType === "psicologo" ? "/dashboard" : "/paciente"
        router.push(redirectPath)
      }
    }
  }, [session, router])

  if (!supabase) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Brain className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    console.log("Login attempt started...")

    if (!formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos.")
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("Attempting to sign in with:", formData.email)
      const { data, error: loginError } = await supabase.auth.signInWithPassword(formData)
      console.log("Sign in response:", { data, error: loginError })
      
      if (loginError) throw loginError

      if (!data.user) {
        throw new Error("Usuário não encontrado")
      }

      // No need to manually check user type as it's handled by Supabase
      console.log("Login successful, waiting for session update...")
      toast({
        title: "Login bem-sucedido",
        description: "Você foi autenticado com sucesso!",
      })

      // Wait a bit for the session to be properly set
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error: any) {
      console.error("Login error details:", error)
      const errorMessage = error.message || "Credenciais inválidas. Tente novamente."
      setError(errorMessage)
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-2 text-center">
            <Brain className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">Entrar na plataforma</h1>
            <p className="text-muted-foreground">Entre com seu e-mail e senha para acessar sua conta</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={formData.password} 
                onChange={handleChange}
              />
            </div>
            <Button 
              className="w-full" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-center text-sm">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-primary underline-offset-4 hover:underline">
                Registre-se
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
