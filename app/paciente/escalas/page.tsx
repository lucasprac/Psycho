"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getPatientScaleApplications, updateExpiredApplications } from "@/lib/services/scale-service"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ScaleApplication } from "@/lib/types/scales"

export default function EscalasPacientePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [applications, setApplications] = useState<ScaleApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchApplications() {
      if (!user) return

      setIsLoading(true)

      try {
        // Verificar e atualizar aplicações vencidas
        await updateExpiredApplications()

        // Buscar aplicações de escalas
        const data = await getPatientScaleApplications(user.id)
        setApplications(data)
      } catch (err) {
        console.error("Erro ao buscar aplicações de escalas:", err)
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas escalas.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplications()
  }, [user, toast])

  // Separar aplicações pendentes e concluídas
  const pendingApplications = applications.filter((app) => app.status === "pending")
  const completedApplications = applications.filter((app) => app.status === "completed")

  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (e) {
      return "Data inválida"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Escalas Psicométricas</h1>
        <p className="text-muted-foreground">Preencha as escalas solicitadas pelo seu psicólogo</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Escalas Pendentes</CardTitle>
            <CardDescription>Escalas que precisam ser preenchidas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(2)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <div className="flex gap-2 mt-2">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  ))}
              </div>
            ) : pendingApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">Você não tem escalas pendentes no momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApplications.map((app) => (
                  <div key={app.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{app.scale?.name}</h3>
                      <p className="text-sm text-muted-foreground">{app.scale?.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                          Até {formatDate(app.due_date)}
                        </span>
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                          5-10 minutos
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1" asChild>
                      <Link href={`/paciente/escalas/responder/${app.id}`}>
                        Preencher
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escalas Concluídas</CardTitle>
            <CardDescription>Escalas que você já preencheu</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-40 mt-2" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  ))}
              </div>
            ) : completedApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">Você ainda não completou nenhuma escala.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedApplications.map((app) => (
                  <div key={app.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{app.scale?.name}</h3>
                      <p className="text-sm text-muted-foreground">{app.scale?.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Preenchida em: {app.completed_at ? formatDate(app.completed_at) : "Data desconhecida"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/paciente/escalas/resultados/${app.id}`}>Ver resultados</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
