"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Brain } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createSupabaseClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "paciente",
    crp: "", // CRP para psicólogos
    psychologistCrp: "", // CRP do psicólogo para pacientes
  })
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, userType: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Create user in Auth with metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_type: formData.userType,
            name: formData.name
          }
        }
      })

      if (signUpError) throw signUpError

      if (!data.user) {
        throw new Error("Erro ao criar usuário")
      }

      // Create user record in database with the same type from metadata
      const { error: dbError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email: formData.email,
          name: formData.name,
          user_type: data.user.user_metadata.user_type
        })

      if (dbError) throw dbError

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você será redirecionado para a página de login.",
      })

      router.push("/login")
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Erro ao criar conta. Tente novamente.")
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao criar conta. Tente novamente.",
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
            <h1 className="text-3xl font-bold">Criar uma conta</h1>
            <p className="text-muted-foreground">Preencha os dados abaixo para criar sua conta</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Seu nome completo" value={formData.name} onChange={handleChange} />
            </div>
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
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={formData.password} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de usuário</Label>
              <RadioGroup value={formData.userType} onValueChange={handleRadioChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="psicologo" id="psicologo" />
                  <Label htmlFor="psicologo">Psicólogo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paciente" id="paciente" />
                  <Label htmlFor="paciente">Paciente</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.userType === "psicologo" && (
              <div className="space-y-2">
                <Label htmlFor="crp">Número do CRP</Label>
                <Input id="crp" placeholder="Ex: 06/12345" value={formData.crp} onChange={handleChange} />
                <p className="text-xs text-muted-foreground">
                  Informe seu número de registro no Conselho Regional de Psicologia.
                </p>
              </div>
            )}

            {formData.userType === "paciente" && (
              <div className="space-y-2">
                <Label htmlFor="psychologistCrp">CRP do seu psicólogo</Label>
                <Input
                  id="psychologistCrp"
                  placeholder="Ex: 06/12345"
                  value={formData.psychologistCrp}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Informe o número de CRP do seu psicólogo para vincular-se a ele.
                </p>
              </div>
            )}

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar"}
            </Button>
            <div className="text-center text-sm">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Entrar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
