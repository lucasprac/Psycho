"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getScaleById } from "@/lib/services/scale-service"
import { Skeleton } from "@/components/ui/skeleton"
import type { Scale } from "@/lib/types/scales"

// Helper function to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function EscalaDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [scale, setScale] = useState<Scale | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInvalidId, setIsInvalidId] = useState(false)

  const scaleId = params.id as string

  useEffect(() => {
    // Check if the ID is a valid UUID format
    if (!isValidUUID(scaleId)) {
      setIsInvalidId(true)
      setIsLoading(false)
      return
    }

    async function fetchScaleDetails() {
      if (!user) return

      setIsLoading(true)

      try {
        const data = await getScaleById(scaleId)

        if (!data) {
          toast({
            title: "Erro",
            description: "Escala não encontrada.",
            variant: "destructive",
          })
          router.push("/dashboard/escalas")
          return
        }

        setScale(data)
      } catch (err) {
        console.error("Erro ao buscar detalhes da escala:", err)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da escala.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchScaleDetails()
  }, [user, scaleId, router, toast])

  if (isInvalidId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">ID de escala inválido</h2>
        <p className="text-muted-foreground mb-6">O ID da escala fornecido não é válido.</p>
        <Button asChild>
          <Link href="/dashboard/escalas">Voltar para lista de escalas</Link>
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

  if (!scale) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Escala não encontrada</h2>
        <p className="text-muted-foreground mb-6">A escala solicitada não foi encontrada.</p>
        <Button asChild>
          <Link href="/dashboard/escalas">Voltar para lista de escalas</Link>
        </Button>
      </div>
    )
  }

  // Renderizar itens da escala
  const renderScaleItems = () => {
    // Escala de Ansiedade de Beck (BAI)
    if (scale.name.includes("Ansiedade")) {
      return (
        <div className="space-y-4">
          {Array.isArray(scale.questions.items) &&
            scale.questions.items.map((item, index) => (
              <div key={index} className="p-3 border rounded-md">
                <p className="font-medium">
                  {index + 1}. {typeof item === "string" ? item : item.text}
                </p>
              </div>
            ))}
        </div>
      )
    }
    // Inventário de Depressão de Beck (BDI-II)
    else if (scale.name.includes("Depressão")) {
      return (
        <div className="space-y-4">
          {scale.questions.groups &&
            scale.questions.groups.map((group, index) => (
              <div key={index} className="p-3 border rounded-md">
                <p className="font-medium mb-2">
                  {index + 1}. {group.title}
                </p>
                <div className="space-y-2 pl-4">
                  {group.options &&
                    group.options.map((option, optIndex) => (
                      <p key={optIndex} className="text-sm">
                        • {option.text}
                      </p>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )
    }
    // Escala de Desesperança de Beck (BHS)
    else if (scale.name.includes("Desesperança")) {
      return (
        <div className="space-y-4">
          {Array.isArray(scale.questions.items) &&
            scale.questions.items.map((item, index) => (
              <div key={index} className="p-3 border rounded-md">
                <p className="font-medium">
                  {index + 1}. {typeof item === "string" ? item : item.text}
                </p>
              </div>
            ))}
        </div>
      )
    }

    return <p>Tipo de escala não suportado</p>
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
          <h1 className="text-3xl font-bold tracking-tight">{scale.name}</h1>
          <p className="text-muted-foreground">{scale.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detalhes da Escala</CardTitle>
            <Badge
              variant="outline"
              className={
                scale.type === "padronizada"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
              }
            >
              {scale.type === "padronizada" ? "Padronizada" : "Customizada"}
            </Badge>
          </div>
          <CardDescription>Informações sobre a escala e seus itens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {scale.questions.instructions && (
              <div className="p-4 bg-muted/50 rounded-md">
                <h3 className="font-medium mb-2">Instruções</h3>
                <p className="text-sm">{scale.questions.instructions}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium mb-4">Itens da Escala</h3>
              {renderScaleItems()}
            </div>

            {scale.questions.scoring && (
              <div>
                <h3 className="text-lg font-medium mb-4">Interpretação dos Resultados</h3>
                <div className="space-y-2">
                  {scale.questions.scoring.ranges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline" className="min-w-[100px] justify-center">
                        {range.min} - {range.max}
                      </Badge>
                      <span>{range.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button asChild>
                <Link href={`/dashboard/escalas/aplicar?scale=${scale.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Aplicar Escala
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
