"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, FileText, User, AlertCircle, CheckCircle } from "lucide-react"
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

export default function AplicacaoDetalhesPage() {
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
            description: "Aplicação não encontrada ou você não tem permissão para acessá-la.",
            variant: "destructive",
          })
          router.push("/dashboard/escalas/aplicacoes")
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

  // Verificar se a data de vencimento já passou
  const isPastDue = (dateString: string) => {
    try {
      const dueDate = new Date(dateString)
      return dueDate < new Date()
    } catch (e) {
      return false
    }
  }

  // Renderizar respostas da escala
  const renderScaleResponses = () => {
    if (!application || !application.responses || !application.scale) return null

    // Escala de Ansiedade de Beck (BAI)
    if (application.scale.name.includes("Ansiedade")) {
      const items = application.scale.questions.items || []
      const options = application.scale.questions.options || []

      return (
        <div className="space-y-4">
          {items.map((item, index) => {
            const response = application.responses?.[index]
            const selectedOption = options.find((opt) => opt.value === response)

            return (
              <div key={index} className="p-3 border rounded-md">
                <p className="font-medium">
                  {index + 1}. {typeof item === "string" ? item : item.text}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Resposta:</span>{" "}
                  {selectedOption ? selectedOption.label : "Não respondido"}
                </p>
              </div>
            )
          })}
        </div>
      )
    }
    // Inventário de Depressão de Beck (BDI-II)
    else if (application.scale.name.includes("Depressão")) {
      const groups = application.scale.questions.groups || []

      return (
        <div className="space-y-4">
          {groups.map((group, index) => {
            const response = application.responses?.[index]
            const selectedOption = group.options?.find((opt) => opt.value === response)

            return (
              <div key={index} className="p-3 border rounded-md">
                <p className="font-medium mb-2">
                  {index + 1}. {group.title}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Resposta:</span>{" "}
                  {selectedOption ? selectedOption.text : "Não respondido"}
                </p>
              </div>
            )
          })}
        </div>
      )
    }
    // Escala de Desesperança de Beck (BHS)
    else if (application.scale.name.includes("Desesperança")) {
      const items = application.scale.questions.items || []
      const options = application.scale.questions.options || []
      const reverseItems = application.scale.questions.reverse_items || []

      return (
        <div className="space-y-4">
          {items.map((item, index) => {
            const response = application.responses?.[index]
            const isReverse = reverseItems.includes(index + 1)
            const selectedOption = options.find((opt) => opt.value === response)

            return (
              <div key={index} className="p-3 border rounded-md">
                <p className="font-medium">
                  {index + 1}. {typeof item === "string" ? item : item.text}
                  {isReverse && <span className="text-xs text-muted-foreground ml-2">(Item invertido)</span>}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Resposta:</span>{" "}
                  {selectedOption ? selectedOption.label : "Não respondido"}
                </p>
              </div>
            )
          })}
        </div>
      )
    }

    return <p>Tipo de escala não suportado</p>
  }

  // Renderizar resultado da escala
  const renderScaleResult = () => {
    if (!application || application.status !== "completed" || !application.scale || application.score === undefined)
      return null

    const interpretation = interpretScaleScore(application.scale, application.score)

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resultado da Avaliação</CardTitle>
          <CardDescription>Pontuação e interpretação dos resultados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Pontuação Total</h3>
              <p className="text-3xl font-bold">{application.score}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Interpretação</h3>
              <Badge className="text-base py-1 px-3">{interpretation}</Badge>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Conclusão</h3>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{application.completed_at ? formatDate(application.completed_at) : "Não concluída"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isInvalidId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">ID de aplicação inválido</h2>
        <p className="text-muted-foreground mb-6">O ID da aplicação fornecido não é válido.</p>
        <Button asChild>
          <Link href="/dashboard/escalas/aplicacoes">Voltar para lista de aplicações</Link>
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
          <Link href="/dashboard/escalas/aplicacoes">Voltar para lista de aplicações</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/escalas/aplicacoes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{application.scale?.name}</h1>
          <p className="text-muted-foreground">Aplicação para {application.patient?.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalhes da Aplicação</CardTitle>
              <CardDescription>{application.scale?.description}</CardDescription>
            </div>
            <Badge
              variant="outline"
              className={
                application.status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : application.status === "expired"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                    : isPastDue(application.due_date)
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              }
            >
              {application.status === "completed"
                ? "Concluída"
                : application.status === "expired"
                  ? "Expirada"
                  : isPastDue(application.due_date)
                    ? "Atrasada"
                    : "Pendente"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Paciente</h3>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{application.patient?.name}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Data de Vencimento</h3>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span
                  className={
                    isPastDue(application.due_date) && application.status === "pending" ? "text-destructive" : ""
                  }
                >
                  {formatDate(application.due_date)}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Data de Criação</h3>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(application.created_at)}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tipo de Escala</h3>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{application.scale?.type === "padronizada" ? "Escala Padronizada" : "Escala Customizada"}</span>
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          {application.status === "completed" ? (
            <div>
              <h3 className="text-lg font-medium mb-4">Respostas do Paciente</h3>
              {renderScaleResponses()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {application.status === "expired"
                  ? "Esta aplicação expirou e não foi respondida pelo paciente."
                  : "Esta aplicação ainda não foi respondida pelo paciente."}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/dashboard/escalas/aplicacoes">Voltar</Link>
          </Button>
        </CardFooter>
      </Card>

      {renderScaleResult()}
    </div>
  )
}
