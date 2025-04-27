"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/services/supabase-service"
import { Loader2 } from "lucide-react"

export default function NovoPacientePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    emergencyContact: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para cadastrar pacientes.",
        variant: "destructive",
      })
      return
    }

    // Validação básica
    if (!formData.name || !formData.email) {
      toast({
        title: "Erro de validação",
        description: "Nome e e-mail são campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()
      console.log("Iniciando cadastro de paciente...")

      // Gerar uma senha temporária
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

      // 1. Verificar se o e-mail já está em uso
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle()

      if (checkError) {
        console.error("Erro ao verificar e-mail:", checkError)
        throw new Error("Erro ao verificar se o e-mail já está em uso.")
      }

      if (existingUser) {
        throw new Error("Este e-mail já está cadastrado no sistema.")
      }

      // 2. Criar o usuário no Auth
      console.log("Criando usuário na autenticação...")
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            name: formData.name,
            user_type: "paciente",
          },
        },
      })

      if (authError) {
        console.error("Erro na autenticação:", authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error("Falha ao criar usuário.")
      }

      const newUserId = authData.user.id
      console.log("Usuário criado com ID:", newUserId)

      // 3. Inserir na tabela users
      console.log("Inserindo na tabela users...")
      const { error: userError } = await supabase.from("users").insert({
        id: newUserId,
        email: formData.email,
        name: formData.name,
        password: "", // Não armazenamos a senha em texto simples
        user_type: "paciente",
      })

      if (userError) {
        console.error("Erro ao inserir usuário:", userError)
        // Tentar limpar o usuário Auth criado em caso de erro
        await supabase.auth.admin.deleteUser(newUserId)
        throw userError
      }

      // 4. Inserir na tabela patients
      console.log("Inserindo na tabela patients...")
      const { error: patientError } = await supabase.from("patients").insert({
        id: newUserId,
        psychologist_id: user.id,
        date_of_birth: formData.dateOfBirth || null,
        phone: formData.phone || null,
        emergency_contact: formData.emergencyContact || null,
        notes: formData.notes || null,
        status: "active",
      })

      if (patientError) {
        console.error("Erro ao inserir paciente:", patientError)
        // Tentar limpar os dados em caso de erro
        await supabase.from("users").delete().eq("id", newUserId)
        await supabase.auth.admin.deleteUser(newUserId)
        throw patientError
      }

      // 5. Criar notificação para o psicólogo
      console.log("Criando notificação...")
      const { error: notificationError } = await supabase.from("notifications").insert({
        recipient_id: user.id,
        type: "patient",
        title: "Novo paciente cadastrado",
        description: `${formData.name} foi adicionado à sua lista de pacientes.`,
        link: `/dashboard/pacientes/${newUserId}`,
        read: false,
      })

      if (notificationError) {
        console.error("Erro ao criar notificação:", notificationError)
        // Não vamos falhar o cadastro por causa de uma notificação
      }

      toast({
        title: "Paciente cadastrado com sucesso!",
        description: "Um e-mail com instruções de acesso foi enviado para o paciente.",
      })

      // Redirecionar para a lista de pacientes
      router.push("/dashboard/pacientes")
    } catch (error: any) {
      console.error("Erro no cadastro:", error)
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao cadastrar o paciente. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Paciente</h1>
        <p className="text-muted-foreground">Cadastre um novo paciente na plataforma</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Paciente</CardTitle>
            <CardDescription>Preencha os dados do novo paciente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                placeholder="Nome completo do paciente"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Um e-mail com instruções de acesso será enviado para este endereço.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Contato de Emergência</Label>
              <Input
                id="emergencyContact"
                placeholder="Nome e telefone"
                value={formData.emergencyContact}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre o paciente"
                value={formData.notes}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/pacientes")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Paciente"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
