"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Mail, Phone, AlertCircle, FileText, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/services/supabase-service"
import { Skeleton } from "@/components/ui/skeleton"

type Patient = {
  id: string
  name: string
  email: string
  phone: string | null
  dateOfBirth: string | null
  emergencyContact: string | null
  notes: string | null
  status: "active" | "inactive"
}

type Session = {
  id: string
  date: string
  time: string
  duration: number
  status: "scheduled" | "completed" | "cancelled"
}

type Activity = {
  id: string
  title: string
  description: string | null
  scheduledDate: string
  status: "scheduled" | "completed" | "cancelled"
}

type Scale = {
  id: string
  name: string
  dueDate: string | null
  status: "pending" | "completed" | "expired"
}

// Função para validar UUID
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function PatientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [scales, setScales] = useState<Scale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInvalidId, setIsInvalidId] = useState(false)

  const patientId = params.id as string

  useEffect(() => {
    // Verificar se o ID é um UUID válido
    if (!isValidUUID(patientId)) {
      setIsInvalidId(true)
      setIsLoading(false)
      return
    }

    async function fetchPatientData() {
      if (!user || !patientId) return

      setIsLoading(true)

      try {
        const supabase = getSupabaseClient()

        // Buscar dados do paciente
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select(`
            id,
            status,
            date_of_birth,
            phone,
            emergency_contact,
            notes,
            users (
              id,
              name,
              email
            )
          `)
          .eq("id", patientId)
          .eq("psychologist_id", user.id)
          .single()

        if (patientError) throw patientError

        if (!patientData) {
          toast({
            title: "Erro",
            description: "Paciente não encontrado ou você não tem permissão para acessá-lo.",
            variant: "destructive",
          })
          router.push("/dashboard/pacientes")
          return
        }

        setPatient({
          id: patientData.id,
          name: patientData.users?.name || "Nome não disponível",
          email: patientData.users?.email || "Email não disponível",
          phone: patientData.phone,
          dateOfBirth: patientData.date_of_birth,
          emergencyContact: patientData.emergency_contact,
          notes: patientData.notes,
          status: patientData.status,
        })

        // Buscar sessões do paciente
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select("id, date, time, duration, status")
          .eq("patient_id", patientId)
          .order("date", { ascending: false })
          .limit(5)

        if (sessionsError && sessionsError.code !== "PGRST116") {
          console.error("Erro ao buscar sessões:", sessionsError)
        } else if (sessionsData) {
          setSessions(sessionsData)
        }

        // Buscar atividades do paciente
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("activities")
          .select("id, title, description, scheduled_date, status")
          .eq("patient_id", patientId)
          .order("scheduled_date", { ascending: false })
          .limit(5)

        if (activitiesError && activitiesError.code !== "PGRST116") {
          console.error("Erro ao buscar atividades:", activitiesError)
        } else if (activitiesData) {
          setActivities(
            activitiesData.map((activity) => ({
              id: activity.id,
              title: activity.title,
              description: activity.description,
              scheduledDate: activity.scheduled_date,
              status: activity.status,
            })),
          )
        }

        // Buscar escalas atribuídas ao paciente
        const { data: scalesData, error: scalesError } = await supabase
          .from("scale_applications")
          .select(`
            id,
            due_date,
            status,
            scales (
              id,
              name
            )
          `)
          .eq("patient_id", patientId)
          .order("due_date", { ascending: false })
          .limit(5)

        if (scalesError && scalesError.code !== "PGRST116") {
          console.error("Erro ao buscar escalas:", scalesError)
        } else if (scalesData) {
          setScales(
            scalesData.map((scale) => ({
              id: scale.id,
              name: scale.scales?.name || "Escala sem nome",
              dueDate: scale.due_date,
              status: scale.status,
            })),
          )
        }
      } catch (err) {
        console.error("Erro ao buscar dados do paciente:", err)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do paciente.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatientData()
  }, [user, patientId, router, toast])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Ainda não disponível"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  if (isInvalidId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">ID de paciente inválido</h2>
        <p className="text-muted-foreground mb-6">
          O ID do paciente fornecido não é válido. Se você está tentando criar um novo paciente, use o botão abaixo.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/dashboard/pacientes")}>Voltar para lista de pacientes</Button>
          <Button onClick={() => router.push("/dashboard/pacientes/novo")} variant="outline">
            Criar novo paciente
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Paciente não encontrado</h2>
        <p className="text-muted-foreground mb-6">
          O paciente solicitado não foi encontrado ou você não tem permissão para acessá-lo.
        </p>
        <Button onClick={() => router.push("/dashboard/pacientes")}>Voltar para lista de pacientes</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
          <p className="text-muted-foreground">Detalhes e histórico do paciente</p>
        </div>
        <Button onClick={() => router.push(`/dashboard/pacientes/${patientId}/editar`)}>Editar Paciente</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Dados cadastrais e informações de contato</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32 text-4xl">
                <AvatarImage src={`/placeholder.svg?height=128&width=128&text=${patient.name.charAt(0)}`} />
                <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Badge
                variant={patient.status === "active" ? "default" : "outline"}
                className={
                  patient.status === "active"
                    ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100"
                }
              >
                {patient.status === "active" ? "Paciente Ativo" : "Paciente Inativo"}
              </Badge>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p>{patient.name || "Ainda não disponível"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {patient.email || "Ainda não disponível"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {patient.phone || "Ainda não disponível"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(patient.dateOfBirth)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Contato de Emergência</p>
                <p>{patient.emergencyContact || "Ainda não disponível"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Observações</p>
                <p className="line-clamp-2">{patient.notes || "Ainda não disponível"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="scales">Escalas</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Sessões</CardTitle>
                  <CardDescription>Últimas sessões realizadas com o paciente</CardDescription>
                </div>
                <Button size="sm">Nova Sessão</Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Ainda não disponível</p>
                  <Button variant="outline" className="mt-4">
                    Agendar Primeira Sessão
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            session.status === "completed"
                              ? "bg-green-100 dark:bg-green-900"
                              : session.status === "cancelled"
                                ? "bg-red-100 dark:bg-red-900"
                                : "bg-blue-100 dark:bg-blue-900"
                          }`}
                        >
                          <Clock
                            className={`h-5 w-5 ${
                              session.status === "completed"
                                ? "text-green-600 dark:text-green-300"
                                : session.status === "cancelled"
                                  ? "text-red-600 dark:text-red-300"
                                  : "text-blue-600 dark:text-blue-300"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {new Date(session.date).toLocaleDateString("pt-BR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                session.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : session.status === "cancelled"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              }
                            >
                              {session.status === "completed"
                                ? "Realizada"
                                : session.status === "cancelled"
                                  ? "Cancelada"
                                  : "Agendada"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.time} - Duração: {session.duration} minutos
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Atividades</CardTitle>
                  <CardDescription>Atividades atribuídas ao paciente</CardDescription>
                </div>
                <Button size="sm">Nova Atividade</Button>
              </div>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Ainda não disponível</p>
                  <Button variant="outline" className="mt-4">
                    Atribuir Atividade
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            activity.status === "completed"
                              ? "bg-green-100 dark:bg-green-900"
                              : activity.status === "cancelled"
                                ? "bg-red-100 dark:bg-red-900"
                                : "bg-blue-100 dark:bg-blue-900"
                          }`}
                        >
                          <CheckCircle
                            className={`h-5 w-5 ${
                              activity.status === "completed"
                                ? "text-green-600 dark:text-green-300"
                                : activity.status === "cancelled"
                                  ? "text-red-600 dark:text-red-300"
                                  : "text-blue-600 dark:text-blue-300"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{activity.title}</p>
                            <Badge
                              variant="outline"
                              className={
                                activity.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : activity.status === "cancelled"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              }
                            >
                              {activity.status === "completed"
                                ? "Concluída"
                                : activity.status === "cancelled"
                                  ? "Cancelada"
                                  : "Agendada"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Data: {new Date(activity.scheduledDate).toLocaleDateString("pt-BR")}
                          </p>
                          {activity.description && <p className="text-sm mt-1">{activity.description}</p>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scales" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Escalas Psicométricas</CardTitle>
                  <CardDescription>Escalas aplicadas ao paciente</CardDescription>
                </div>
                <Button size="sm">Aplicar Escala</Button>
              </div>
            </CardHeader>
            <CardContent>
              {scales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Ainda não disponível</p>
                  <Button variant="outline" className="mt-4">
                    Aplicar Primeira Escala
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {scales.map((scale) => (
                    <div key={scale.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            scale.status === "completed"
                              ? "bg-green-100 dark:bg-green-900"
                              : scale.status === "expired"
                                ? "bg-red-100 dark:bg-red-900"
                                : "bg-yellow-100 dark:bg-yellow-900"
                          }`}
                        >
                          <FileText
                            className={`h-5 w-5 ${
                              scale.status === "completed"
                                ? "text-green-600 dark:text-green-300"
                                : scale.status === "expired"
                                  ? "text-red-600 dark:text-red-300"
                                  : "text-yellow-600 dark:text-yellow-300"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{scale.name}</p>
                            <Badge
                              variant="outline"
                              className={
                                scale.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : scale.status === "expired"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                              }
                            >
                              {scale.status === "completed"
                                ? "Concluída"
                                : scale.status === "expired"
                                  ? "Expirada"
                                  : "Pendente"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {scale.dueDate
                              ? `Prazo: ${new Date(scale.dueDate).toLocaleDateString("pt-BR")}`
                              : "Sem prazo definido"}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Ver Resultados
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
