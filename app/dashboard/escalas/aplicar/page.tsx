"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ArrowLeft, FileText, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getActiveScales, applyScaleToPatient } from "@/lib/services/scale-service"
import { getSupabaseClient } from "@/lib/services/supabase-service"
import { Skeleton } from "@/components/ui/skeleton"
import type { Scale } from "@/lib/types/scales"

type Patient = {
  id: string
  name: string
  email: string
  status: "active" | "inactive"
}

export default function AplicarEscalaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()

  const [scales, setScales] = useState<Scale[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("scale")

  // Verificar se há um ID de escala na URL
  useEffect(() => {
    const scaleId = searchParams.get("scale")
    if (scaleId) {
      setActiveTab("patient")
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      setIsLoading(true)

      try {
        // Buscar escalas
        const scalesData = await getActiveScales()
        setScales(scalesData || [])

        // Verificar se há um ID de escala na URL
        const scaleId = searchParams.get("scale")
        if (scaleId && scalesData) {
          const scale = scalesData.find((s) => s.id === scaleId)
          if (scale) {
            setSelectedScale(scale)
          }
        }

        // Buscar pacientes
        const supabase = getSupabaseClient()
        const { data: patientsData, error: patientsError } = await supabase
          .from("patients")
          .select(`
            id,
            status,
            users (
              id,
              name,
              email
            )
          `)
          .eq("psychologist_id", user.id)
          .eq("status", "active")
          .order("users(name)")

        if (patientsError) throw patientsError

        const formattedPatients = (patientsData || []).map((patient) => ({
          id: patient.id,
          name: patient.users?.name || "Nome não disponível",
          email: patient.users?.email || "Email não disponível",
          status: patient.status,
        }))

        setPatients(formattedPatients)
      } catch (err) {
        console.error("Erro ao buscar dados:", err)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados necessários.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast, searchParams])

  const handleScaleSelect = (scaleId: string) => {
    const scale = scales.find((s) => s.id === scaleId)
    setSelectedScale(scale || null)
    setActiveTab("patient")
  }

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId)
    setActiveTab("review")
  }

  const handleSubmit = async () => {
    // Validar todos os campos obrigatórios
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado para aplicar uma escala.",
        variant: "destructive",
      })
      return
    }

    if (!selectedScale) {
      toast({
        title: "Escala não selecionada",
        description: "Por favor, selecione uma escala para aplicar.",
        variant: "destructive",
      })
      return
    }

    if (!selectedPatient) {
      toast({
        title: "Paciente não selecionado",
        description: "Por favor, selecione um paciente para aplicar a escala.",
        variant: "destructive",
      })
      return
    }

    if (!dueDate) {
      toast({
        title: "Data não selecionada",
        description: "Por favor, selecione uma data de vencimento para a aplicação.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Aplicar escala ao paciente
      const application = await applyScaleToPatient(user.id, selectedPatient, selectedScale.id, dueDate)

      toast({
        title: "Escala atribuída com sucesso",
        description: "A escala foi atribuída ao paciente e está pronta para ser respondida.",
      })

      // Redirecionar para a página de aplicações
      router.push("/dashboard/escalas/aplicacoes")
    } catch (err) {
      console.error("Erro ao atribuir escala:", err)
      toast({
        title: "Erro",
        description: "Não foi possível atribuir a escala ao paciente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedPatientName = () => {
    const patient = patients.find((p) => p.id === selectedPatient)
    return patient ? patient.name : "Paciente não selecionado"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/escalas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aplicar Escala</h1>
          <p className="text-muted-foreground">Selecione uma escala e um paciente para aplicação</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scale">1. Selecionar Escala</TabsTrigger>
          <TabsTrigger value="patient" disabled={!selectedScale}>
            2. Selecionar Paciente
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!selectedScale || !selectedPatient}>
            3. Revisar e Confirmar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scale" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecione uma Escala</CardTitle>
              <CardDescription>Escolha a escala psicométrica que deseja aplicar</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-md">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                      </div>
                    ))}
                </div>
              ) : scales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma escala disponível para aplicação</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scales.map((scale) => (
                    <div key={scale.id} className="flex items-start justify-between p-4 border rounded-md">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{scale.name}</h3>
                          <p className="text-sm text-muted-foreground">{scale.description}</p>
                        </div>
                      </div>
                      <Button onClick={() => handleScaleSelect(scale.id)}>Selecionar</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patient" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecione um Paciente</CardTitle>
              <CardDescription>Escolha o paciente para aplicar a escala {selectedScale?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-md">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                      </div>
                    ))}
                </div>
              ) : patients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum paciente disponível</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/dashboard/pacientes/novo">Cadastrar Paciente</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {patients.map((patient) => (
                    <div key={patient.id} className="flex items-start justify-between p-4 border rounded-md">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{patient.name}</h3>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                        </div>
                      </div>
                      <Button onClick={() => handlePatientSelect(patient.id)}>Selecionar</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revisar e Confirmar</CardTitle>
              <CardDescription>Verifique os detalhes da aplicação da escala</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Escala Selecionada</h3>
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium">{selectedScale?.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedScale?.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Paciente Selecionado</h3>
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium">{getSelectedPatientName()}</h4>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Data de Vencimento</h3>
                  <div className="grid gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("patient")}>
                    Voltar
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : "Aplicar Escala"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
