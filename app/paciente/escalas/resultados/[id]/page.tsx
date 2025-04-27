"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getScaleApplicationById, interpretScaleScore } from "@/lib/services/scale-service"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ScaleApplication } from "@/lib/types/scales"

// Helper function to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function ResultadosEscalaPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [application, setApplication] = useState<ScaleApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInvalidId, setIsInvalidId] = useState(false)

  const applicationId = params.id as string

  useEffect(() => {
    // Check if the ID is a valid UUID format
    if (!isValidUUID(applicationId)) {
      setIsInvalidId(true)
      setIsLoading(false)
      return
    }

    async function fetchApplicationDetails() {
      if (!user || !applicationId) return

      setIsLoading(true)

      try {
        const data = await getScaleApplicationById(applicationId)

        if (!data) {
          toast({
            title: "Erro",
            description: "Aplicação não encontrada.",
            variant: "destructive",
          })
          router.push("/paciente/escalas")
          return
        }

        // Verificar se o usuário tem permissão para ver esta aplicação
        if (data.patient_id !== user.id) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para ver esta aplicação.",
            variant: "destructive",
          })
          router.push("/paciente/escalas")
          return
        }

        // Verificar se a escala foi concluída
        if (data.status !== "completed") {
          toast({
            title: "Escala não concluída",
            description: "Esta escala ainda não foi concluída.",
            variant: "destructive",
          })
          router.push("/paciente/escalas")
          return
        }

        setApplication(data)
      } catch (err) {
        console.error("Erro ao buscar detalhes da aplicação:", err)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da aplicação.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplicationDetails()
  }, [user, applicationId, router, toast])

  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (e) {
      return "Data inválida"
    }
  }

  if (isInvalidId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">ID de aplicação inválido</h2>
        <p className="text-muted-foreground mb-6">O ID da aplicação fornecido não é válido.</p>
        <Button asChild>
          <Link href="/paciente/escalas">Voltar para minhas escalas</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-8 w-64 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Aplicação não encontrada</h2>
        <p className="text-muted-foreground mb-6">A aplicação solicitada não foi encontrada.</p>
        <Button asChild>
          <Link href="/paciente/escalas">Voltar para minhas escalas</Link>
        </Button>
      </div>
    )
  }

  const interpretation = application.scale ? interpretScaleScore(application.scale, application.score || 0) : ""

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/paciente/escalas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{application.scale?.name}</h1>
          <p className="text-muted-foreground">Resultados da sua avaliação</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultado da Avaliação</CardTitle>
          <CardDescription>Pontuação e interpretação dos resultados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Pontuação Total</h3>
                <p className="text-3xl font-bold">{application.score}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Interpretação</h3>
                <Badge className="text-base py-1 px-3">{interpretation}</Badge>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Data de Conclusão</h3>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{application.completed_at ? formatDate(application.completed_at) : "Não concluída"}</span>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-md">
              <h3 className="font-medium mb-2">Nota</h3>
              <p className="text-sm">
                Estes resultados são apenas indicativos e não substituem uma avaliação clínica profissional. Converse
                com seu psicólogo sobre estes resultados na sua próxima sessão.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button asChild>
            <Link href="/paciente/escalas">Voltar para minhas escalas</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
