"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getScaleApplicationById, saveScaleResponses, calculateScaleScore } from "@/lib/services/scale-service"
import { Skeleton } from "@/components/ui/skeleton"
import type { ScaleApplication } from "@/lib/types/scales"

// Helper function to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function ResponderEscalaPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [application, setApplication] = useState<ScaleApplication | null>(null)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInvalidId, setIsInvalidId] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

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

        // Verificar se o usuário tem permissão para responder esta escala
        if (data.patient_id !== user.id) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para responder esta escala.",
            variant: "destructive",
          })
          router.push("/paciente/escalas")
          return
        }

        // Verificar se a escala já foi respondida
        if (data.status === "completed") {
          setIsCompleted(true)
        }

        setApplication(data)

        // Calcular o número total de passos
        let steps = 0
        if (data.scale?.questions.items) {
          steps = Array.isArray(data.scale.questions.items) ? data.scale.questions.items.length : 0
        } else if (data.scale?.questions.groups) {
          steps = data.scale.questions.groups.length
        }
        setTotalSteps(steps)

        // Se já existirem respostas, carregá-las
        if (data.responses) {
          setResponses(data.responses)
        }
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

  const handleResponseChange = (questionIndex: number, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionIndex]: value,
    }))
  }

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    if (!user || !application || !application.scale) return

    setIsSubmitting(true)

    try {
      // Calcular pontuação
      const score = calculateScaleScore(application.scale, responses)

      // Salvar respostas
      await saveScaleResponses(applicationId, responses, score)

      toast({
        title: "Escala respondida com sucesso",
        description: "Suas respostas foram salvas com sucesso.",
      })

      setIsCompleted(true)
    } catch (err) {
      console.error("Erro ao enviar respostas:", err)
      toast({
        title: "Erro",
        description: "Não foi possível enviar suas respostas.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizar questões da escala
  const renderScaleQuestions = () => {
    if (!application || !application.scale) return null

    // Escala de Ansiedade de Beck (BAI)
    if (application.scale.name.includes("Ansiedade")) {
      const items = application.scale.questions.items || []
      const options = application.scale.questions.options || []

      if (currentStep >= items.length) return null

      const item = items[currentStep]

      return (
        <div className="space-y-4">
          <h3 className="font-medium">
            {currentStep + 1}. {typeof item === "string" ? item : item.text}
          </h3>
          <RadioGroup
            value={responses[currentStep]?.toString()}
            onValueChange={(value) => handleResponseChange(currentStep, Number(value))}
          >
            <div className="grid gap-3">
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value.toString()} id={`q${currentStep}-${option.value}`} />
                  <Label htmlFor={`q${currentStep}-${option.value}`} className="flex-1">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )
    }
    // Inventário de Depressão de Beck (BDI-II)
    else if (application.scale.name.includes("Depressão")) {
      const groups = application.scale.questions.groups || []

      if (currentStep >= groups.length) return null

      const group = groups[currentStep]

      return (
        <div className="space-y-4">
          <h3 className="font-medium">{group.title}</h3>
          <RadioGroup
            value={responses[currentStep]?.toString()}
            onValueChange={(value) => handleResponseChange(currentStep, Number(value))}
          >
            <div className="grid gap-3">
              {group.options?.map((option) => (
                <div key={option.value} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50">
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`q${currentStep}-${option.value}`}
                    className="mt-1"
                  />
                  <Label htmlFor={`q${currentStep}-${option.value}`} className="flex-1 leading-normal">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )
    }
    // Escala de Desesperança de Beck (BHS)
    else if (application.scale.name.includes("Desesperança")) {
      const items = application.scale.questions.items || []
      const options = application.scale.questions.options || []
      const reverseItems = application.scale.questions.reverse_items || []

      if (currentStep >= items.length) return null

      const item = items[currentStep]
      const isReverse = reverseItems.includes(currentStep + 1)

      return (
        <div className="space-y-4">
          <h3 className="font-medium">
            {currentStep + 1}. {typeof item === "string" ? item : item.text}
            {isReverse && <span className="text-xs text-muted-foreground ml-2">(Item invertido)</span>}
          </h3>
          <RadioGroup
            value={responses[currentStep]?.toString()}
            onValueChange={(value) => handleResponseChange(currentStep, Number(value))}
          >
            <div className="grid gap-3">
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value.toString()} id={`q${currentStep}-${option.value}`} />
                  <Label htmlFor={`q${currentStep}-${option.value}`} className="flex-1">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )
    }

    return <p>Tipo de escala não suportado</p>
  }

  const isCurrentStepAnswered = () => {
    return responses[currentStep] !== undefined
  }

  const isAllAnswered = () => {
    if (!application) return false

    for (let i = 0; i < totalSteps; i++) {
      if (responses[i] === undefined) {
        return false
      }
    }

    return true
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

  if (isCompleted) {
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
            <p className="text-muted-foreground">Escala respondida com sucesso</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Escala Concluída</CardTitle>
            <CardDescription>Suas respostas foram enviadas com sucesso</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Obrigado por responder!</h2>
            <p className="text-muted-foreground mb-6">
              Suas respostas foram registradas e serão analisadas pelo seu psicólogo.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/paciente/escalas">Voltar para minhas escalas</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

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
          <p className="text-muted-foreground">Responda às perguntas abaixo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Questão {currentStep + 1} de {totalSteps}
              </CardTitle>
              <CardDescription>{application.scale?.description}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}% Concluído
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-2" />

            {application.scale?.questions.instructions && currentStep === 0 && (
              <div className="p-4 bg-muted/50 rounded-md mb-4">
                <h3 className="font-medium mb-2">Instruções:</h3>
                <p className="text-sm">{application.scale.questions.instructions}</p>
              </div>
            )}

            <div className="space-y-8">{renderScaleQuestions()}</div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePreviousStep} disabled={currentStep === 0}>
            Anterior
          </Button>
          <div>
            {currentStep === totalSteps - 1 ? (
              <Button onClick={handleSubmit} disabled={!isAllAnswered() || isSubmitting}>
                {isSubmitting ? "Enviando..." : "Concluir"}
              </Button>
            ) : (
              <Button onClick={handleNextStep} disabled={!isCurrentStepAnswered()}>
                Próximo
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
