import { createSupabaseServerClient } from "@/app/lib/supabase/server-actions"
import { getSupabaseClient } from "@/lib/services/supabase-service"
import type { Scale, ScaleApplication, ApplicationStatus } from "@/lib/types/scales"

// Cache for scales data
let scalesCache: {
  data: Scale[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Função de utilidade para retry com backoff exponencial
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let retries = 0
  let delay = initialDelay

  while (true) {
    try {
      return await fn()
    } catch (error) {
      if (retries >= maxRetries) {
        throw error
      }

      // Verificar se é um erro de limite de requisições
      const isRateLimitError =
        error instanceof Error && (error.message.includes("Too Many Requests") || error.message.includes("429"))

      if (!isRateLimitError) {
        throw error
      }

      // Esperar antes de tentar novamente
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Aumentar o delay para a próxima tentativa (backoff exponencial)
      delay *= 2
      retries++
    }
  }
}

// ==================== FUNÇÕES DO SERVIDOR ====================

// Função para buscar todas as escalas ativas
export async function getActiveScales(): Promise<Scale[]> {
  return retryWithBackoff(async () => {
    try {
      const supabase = await createSupabaseServerClient()
      const { data, error } = await supabase.from("scales").select("*").eq("status", "active").order("name")

      if (error) {
        if (error.message.includes("Too Many Requests") || error.code === "429") {
          throw new Error("Too Many Requests")
        }
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Erro ao buscar escalas:", error)
      throw error
    }
  }, 2) // Reduzido para 2 tentativas
}

// Função para buscar uma escala específica
export async function getScaleById(scaleId: string): Promise<Scale | null> {
  return retryWithBackoff(async () => {
    try {
      const supabase = await createSupabaseServerClient()
      const { data, error } = await supabase.from("scales").select("*").eq("id", scaleId).single()

      if (error) {
        if (error.message.includes("Too Many Requests") || error.code === "429") {
          throw new Error("Too Many Requests")
        }
        throw error
      }

      return data
    } catch (error) {
      console.error(`Erro ao buscar escala ${scaleId}:`, error)
      if (error instanceof Error && error.message.includes("Too Many Requests")) {
        throw error
      }
      return null
    }
  }, 2) // Reduzido para 2 tentativas
}

// Função para buscar aplicações de escalas para um psicólogo
export async function getPsychologistScaleApplications(psychologistId: string): Promise<ScaleApplication[]> {
  return retryWithBackoff(async () => {
    try {
      const supabase = await createSupabaseServerClient()

      // Buscar respostas de escalas
      const { data: applications, error } = await supabase
        .from("scale_applications")
        .select("*")
        .eq("psychologist_id", psychologistId)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.message.includes("Too Many Requests") || error.code === "429") {
          throw new Error("Too Many Requests")
        }
        throw error
      }

      // Buscar detalhes das escalas separadamente
      if (applications && applications.length > 0) {
        const scaleIds = [...new Set(applications.map((r) => r.scale_id))]

        const { data: scales, error: scalesError } = await supabase.from("scales").select("*").in("id", scaleIds)

        if (scalesError) {
          if (scalesError.message.includes("Too Many Requests") || scalesError.code === "429") {
            throw new Error("Too Many Requests")
          }
          throw scalesError
        }

        const patientIds = [...new Set(applications.map((r) => r.patient_id))]

        const { data: patients, error: patientsError } = await supabase.from("users").select("*").in("id", patientIds)

        if (patientsError) {
          if (patientsError.message.includes("Too Many Requests") || patientsError.code === "429") {
            throw new Error("Too Many Requests")
          }
          throw patientsError
        }

        // Associar escalas às respostas
        const formattedApplications = applications.map((application) => {
          const scale = scales?.find((s) => s.id === application.scale_id)
          const patient = patients?.find((p) => p.id === application.patient_id)

          return {
            id: application.id,
            psychologist_id: application.psychologist_id,
            patient_id: application.patient_id,
            scale_id: application.scale_id,
            due_date: application.due_date,
            status: application.status,
            responses: application.responses,
            score: application.score,
            created_at: application.created_at,
            completed_at: application.completed_at,
            scale: scale || null,
            patient: {
              name: patient?.name || "Paciente não encontrado",
              email: patient?.email || "",
            },
          }
        })

        return formattedApplications || []
      }

      return []
    } catch (error) {
      console.error("Erro ao buscar aplicações de escalas:", error)
      throw error
    }
  })
}

// Função para buscar aplicações de escalas para um paciente
export async function getPatientScaleApplications(patientId: string): Promise<ScaleApplication[]> {
  return retryWithBackoff(async () => {
    try {
      const supabase = await createSupabaseServerClient()
      const { data: applications, error } = await supabase
        .from("scale_applications")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.message.includes("Too Many Requests") || error.code === "429") {
          throw new Error("Too Many Requests")
        }
        throw error
      }

      if (applications && applications.length > 0) {
        const scaleIds = [...new Set(applications.map((r) => r.scale_id))]

        const { data: scales, error: scalesError } = await supabase.from("scales").select("*").in("id", scaleIds)

        if (scalesError) {
          if (scalesError.message.includes("Too Many Requests") || scalesError.code === "429") {
            throw new Error("Too Many Requests")
          }
          throw scalesError
        }

        const formattedApplications = applications.map((application) => {
          const scale = scales?.find((s) => s.id === application.scale_id)

          return {
            id: application.id,
            psychologist_id: application.psychologist_id,
            patient_id: application.patient_id,
            scale_id: application.scale_id,
            due_date: application.due_date,
            status: application.status,
            responses: application.responses,
            score: application.score,
            created_at: application.created_at,
            completed_at: application.completed_at,
            scale: scale || null,
          }
        })

        return formattedApplications || []
      }

      return []
    } catch (error) {
      console.error("Erro ao buscar aplicações de escalas do paciente:", error)
      throw error
    }
  })
}

// Função para buscar uma aplicação específica
export async function getScaleApplicationById(applicationId: string): Promise<ScaleApplication | null> {
  return retryWithBackoff(async () => {
    try {
      const supabase = await createSupabaseServerClient()
      const { data: application, error } = await supabase
        .from("scale_applications")
        .select("*")
        .eq("id", applicationId)
        .single()

      if (error) {
        if (error.message.includes("Too Many Requests") || error.code === "429") {
          throw new Error("Too Many Requests")
        }
        throw error
      }

      if (application) {
        const { data: scale, error: scaleError } = await supabase
          .from("scales")
          .select("*")
          .eq("id", application.scale_id)
          .single()

        if (scaleError) {
          if (scaleError.message.includes("Too Many Requests") || scaleError.code === "429") {
            throw new Error("Too Many Requests")
          }
          throw scaleError
        }

        const { data: patient, error: patientError } = await supabase
          .from("users")
          .select("*")
          .eq("id", application.patient_id)
          .single()

        if (patientError) {
          if (patientError.message.includes("Too Many Requests") || patientError.code === "429") {
            throw new Error("Too Many Requests")
          }
          throw patientError
        }

        return {
          id: application.id,
          psychologist_id: application.psychologist_id,
          patient_id: application.patient_id,
          scale_id: application.scale_id,
          due_date: application.due_date,
          status: application.status,
          responses: application.responses,
          score: application.score,
          created_at: application.created_at,
          completed_at: application.completed_at,
          scale: scale || null,
          patient: {
            name: patient?.name || "Paciente não encontrado",
            email: patient?.email || "",
          },
        }
      }

      return null
    } catch (error) {
      console.error("Erro ao buscar aplicação de escala:", error)
      throw error
    }
  })
}

// ==================== FUNÇÕES DO CLIENTE ====================

// Função para aplicar uma escala a um paciente (cliente)
export async function applyScaleToPatient(
  psychologistId: string,
  patientId: string,
  scaleId: string,
  dueDate: Date,
): Promise<ScaleApplication> {
  return retryWithBackoff(async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("scale_applications")
        .insert({
          psychologist_id: psychologistId,
          patient_id: patientId,
          scale_id: scaleId,
          due_date: dueDate.toISOString(),
          status: "pending",
        })
        .select()
        .single()

      if (error) {
        if (error.message.includes("Too Many Requests") || error.code === "429") {
          throw new Error("Too Many Requests")
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Erro ao aplicar escala:", error)
      throw error
    }
  })
}

// Função para salvar respostas de uma escala (cliente)
export async function saveScaleResponses(
  applicationId: string,
  responses: Record<string, any>,
  score: number,
): Promise<void> {
  return retryWithBackoff(async () => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("scale_applications")
        .update({
          responses,
          score,
          status: "completed" as ApplicationStatus,
          completed_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (error) {
        if (error.message.includes("Too Many Requests") || error.code === "429") {
          throw new Error("Too Many Requests")
        }
        throw error
      }
    } catch (error) {
      console.error("Erro ao salvar respostas:", error)
      throw error
    }
  })
}

// Função para verificar e atualizar aplicações vencidas (cliente)
export async function updateExpiredApplications(): Promise<void> {
  return retryWithBackoff(async () => {
    try {
      const supabase = getSupabaseClient()
      const now = new Date().toISOString()

      // Buscar aplicações pendentes com data de vencimento passada
      const { data, error } = await supabase
        .from("scale_applications")
        .select("id")
        .eq("status", "pending")
        .lt("due_date", now)

      if (error) {
        if (error.message.includes("Too Many Requests") || error.code === "429") {
          throw new Error("Too Many Requests")
        }
        throw error
      }

      // Atualizar status para expirado
      if (data && data.length > 0) {
        const ids = data.map((app) => app.id)
        const { error: updateError } = await supabase
          .from("scale_applications")
          .update({ status: "expired" as ApplicationStatus })
          .in("id", ids)

        if (updateError) {
          if (updateError.message.includes("Too Many Requests") || updateError.code === "429") {
            throw new Error("Too Many Requests")
          }
          throw updateError
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar aplicações vencidas:", error)
      throw error
    }
  })
}

// ==================== FUNÇÕES UTILITÁRIAS (INDEPENDENTES) ====================

// Função para calcular pontuação da escala
export function calculateScaleScore(scale: Scale, responses: Record<string, number>): number {
  let totalScore = 0

  // Escala de Ansiedade de Beck (BAI)
  if (scale.name.includes("Ansiedade")) {
    // Soma direta dos valores
    Object.values(responses).forEach((value) => {
      totalScore += value || 0
    })
  }
  // Inventário de Depressão de Beck (BDI-II)
  else if (scale.name.includes("Depressão")) {
    // Soma direta dos valores
    Object.values(responses).forEach((value) => {
      totalScore += value || 0
    })
  }
  // Escala de Desesperança de Beck (BHS)
  else if (scale.name.includes("Desesperança")) {
    const reverseItems = scale.questions.reverse_items || []

    Object.entries(responses).forEach(([key, value]) => {
      const questionIndex = Number(key)
      const isReverse = reverseItems.includes(questionIndex + 1)

      if (isReverse) {
        // Para itens invertidos, 0 vale 1 e 1 vale 0
        totalScore += value === 0 ? 1 : 0
      } else {
        // Para itens não invertidos, 1 vale 1 e 0 vale 0
        totalScore += value || 0
      }
    })
  }

  return totalScore
}

// Função para interpretar a pontuação da escala
export function interpretScaleScore(scale: Scale, score: number): string {
  const ranges = scale.questions.scoring?.ranges || []

  for (const range of ranges) {
    if (score >= range.min && score <= range.max) {
      return range.label
    }
  }

  return "Não foi possível interpretar o resultado"
}
