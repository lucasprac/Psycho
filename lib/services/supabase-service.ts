'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

// Função para obter o cliente do Supabase no lado do cliente
export const getSupabaseClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  })
}

// Função para obter estatísticas do dashboard
export async function getDashboardStats(psychologistId: string) {
  const supabase = getSupabaseClient()

  try {
    // Buscar total de pacientes
    const { count: totalPatients, error: patientsError } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("psychologist_id", psychologistId)
      .eq("status", "active")

    if (patientsError) throw patientsError

    // Buscar pacientes novos no último mês
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthIso = lastMonth.toISOString()

    const { count: newPatients, error: newPatientsError } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("psychologist_id", psychologistId)
      .eq("status", "active")
      .gte("created_at", lastMonthIso)

    if (newPatientsError) throw newPatientsError

    // Buscar sessões completadas
    const { count: completedSessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("psychologist_id", psychologistId)
      .eq("status", "completed")

    if (sessionsError) throw sessionsError

    // Buscar sessões completadas na última semana
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastWeekIso = lastWeek.toISOString()

    const { count: recentSessions, error: recentSessionsError } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("psychologist_id", psychologistId)
      .eq("status", "completed")
      .gte("date", lastWeekIso)

    if (recentSessionsError) throw recentSessionsError

    // Buscar escalas aplicadas
    const { count: appliedScales, error: scalesError } = await supabase
      .from("scale_applications")
      .select("*", { count: "exact", head: true })
      .eq("psychologist_id", psychologistId)

    if (scalesError) throw scalesError

    // Buscar escalas aplicadas na última semana
    const { count: recentScales, error: recentScalesError } = await supabase
      .from("scale_applications")
      .select("*", { count: "exact", head: true })
      .eq("psychologist_id", psychologistId)
      .gte("created_at", lastWeekIso)

    if (recentScalesError) throw recentScalesError

    // Buscar atividades agendadas
    const { count: scheduledActivities, error: activitiesError } = await supabase
      .from("activities")
      .select("*", { count: "exact", head: true })
      .eq("psychologist_id", psychologistId)
      .eq("status", "scheduled")

    if (activitiesError) throw activitiesError

    // Buscar atividades agendadas no último mês
    const { count: recentActivities, error: recentActivitiesError } = await supabase
      .from("activities")
      .select("*", { count: "exact", head: true })
      .eq("psychologist_id", psychologistId)
      .eq("status", "scheduled")
      .gte("created_at", lastMonthIso)

    if (recentActivitiesError) throw recentActivitiesError

    // Calcular tendências
    const patientsTrend = newPatients || 0
    const sessionsTrend = recentSessions || 0
    const scalesTrend = recentScales || 0
    const activitiesTrend = recentActivities || 0

    return {
      totalPatients: totalPatients || 0,
      patientsTrend,
      completedSessions: completedSessions || 0,
      sessionsTrend,
      appliedScales: appliedScales || 0,
      scalesTrend,
      scheduledActivities: scheduledActivities || 0,
      activitiesTrend,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    throw error
  }
}

// Função para buscar pacientes ativos
export async function getActivePatients(psychologistId: string) {
  const supabase = getSupabaseClient()

  try {
    // Buscar pacientes
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select(
        `
        id,
        status,
        users (
          id,
          name,
          email
        )
      `,
      )
      .eq("psychologist_id", psychologistId)
      .order("status", { ascending: false })
      .limit(10)

    if (patientsError) throw patientsError

    // Para cada paciente, buscar informações adicionais
    const patientsWithDetails = await Promise.all(
      patients.map(async (patient) => {
        // Buscar última sessão
        const { data: lastSessionData, error: lastSessionError } = await supabase
          .from("sessions")
          .select("date")
          .eq("patient_id", patient.id)
          .order("date", { ascending: false })
          .limit(1)
          .single()

        if (lastSessionError && lastSessionError.code !== "PGRST116") {
          // PGRST116 é o código para "nenhum resultado encontrado"
          throw lastSessionError
        }

        // Buscar atividades pendentes
        const { count: pendingActivities, error: activitiesError } = await supabase
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patient.id)
          .eq("status", "scheduled")

        if (activitiesError) throw activitiesError

        // Buscar escalas pendentes
        const { count: pendingScales, error: scalesError } = await supabase
          .from("scale_assignments")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patient.id)
          .eq("status", "pending")

        if (scalesError) throw scalesError

        // Formatar data da última sessão
        const lastSession = lastSessionData
          ? new Date(lastSessionData.date).toLocaleDateString("pt-BR")
          : "Nenhuma sessão"

        return {
          id: patient.id,
          name: patient.users.name,
          pendingActivities: pendingActivities || 0,
          pendingScales: pendingScales || 0,
          lastSession,
          status: patient.status,
        }
      }),
    )

    return patientsWithDetails
  } catch (error) {
    console.error("Erro ao buscar pacientes ativos:", error)
    throw error
  }
}

// Função para buscar sessões
export async function getSessions(psychologistId: string) {
  const supabase = getSupabaseClient()

  try {
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(
        `
        id,
        date,
        time,
        duration,
        status,
        patient_id,
        patients (
          users (
            name
          )
        )
      `,
      )
      .eq("psychologist_id", psychologistId)
      .order("date", { ascending: true })

    if (error) throw error

    return sessions.map((session) => ({
      id: session.id,
      patientId: session.patient_id,
      patientName: session.patients.users.name,
      date: new Date(session.date),
      time: session.time,
      duration: session.duration,
      status: session.status,
    }))
  } catch (error) {
    console.error("Erro ao buscar sessões:", error)
    throw error
  }
}

// Função para buscar notificações
export async function getNotifications(psychologistId: string) {
  const supabase = getSupabaseClient()

  try {
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", psychologistId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      time: formatNotificationTime(notification.created_at),
      read: notification.read,
      link: notification.link,
    }))
  } catch (error) {
    console.error("Erro ao buscar notificações:", error)
    throw error
  }
}

// Função para buscar dados para os gráficos
export async function getChartData(psychologistId: string, timeRange = "30") {
  const supabase = getSupabaseClient()
  const days = Number.parseInt(timeRange)

  try {
    // Definir período
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateIso = startDate.toISOString()

    // Buscar dados de sessões
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sessions")
      .select("date, status")
      .eq("psychologist_id", psychologistId)
      .gte("date", startDateIso)
      .order("date", { ascending: true })

    if (sessionsError) throw sessionsError

    // Buscar dados de escalas
    const { data: scalesData, error: scalesError } = await supabase
      .from("scale_applications")
      .select("scale_id, scales(name), created_at")
      .eq("psychologist_id", psychologistId)
      .gte("created_at", startDateIso)

    if (scalesError) throw scalesError

    // Buscar dados de atividades
    const { data: activitiesData, error: activitiesError } = await supabase
      .from("activities")
      .select("created_at, status")
      .eq("psychologist_id", psychologistId)
      .gte("created_at", startDateIso)
      .order("created_at", { ascending: true })

    if (activitiesError) throw activitiesError

    // Processar dados para gráficos
    const sessionsChartData = processSessionsData(sessionsData, days)
    const scalesChartData = processScalesData(scalesData)
    const activitiesChartData = processActivitiesData(activitiesData, days)

    return {
      sessionsData: sessionsChartData,
      scalesData: scalesChartData,
      activitiesData: activitiesChartData,
    }
  } catch (error) {
    console.error("Erro ao buscar dados para gráficos:", error)
    throw error
  }
}

// Função para marcar notificação como lida
export async function markNotificationAsRead(notificationId: string) {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error)
    throw error
  }
}

// Função para marcar todas as notificações como lidas
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_id", userId)
      .eq("read", false)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Erro ao marcar todas notificações como lidas:", error)
    throw error
  }
}

// Funções auxiliares
function formatNotificationTime(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (diffMins < 60) {
    return `Há ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`
  } else if (diffHours < 24) {
    return `Há ${diffHours} hora${diffHours !== 1 ? "s" : ""}`
  } else if (diffDays < 7) {
    return `Há ${diffDays} dia${diffDays !== 1 ? "s" : ""}`
  } else {
    return date.toLocaleDateString("pt-BR")
  }
}

function processSessionsData(sessions: any[], days: number) {
  // Gerar labels para o período (últimos X dias)
  const labels = []
  const completedData = []
  const cancelledData = []
  const scheduledData = []

  // Criar mapa de datas para contagem
  const completedMap = new Map()
  const cancelledMap = new Map()
  const scheduledMap = new Map()

  // Inicializar mapa com zeros
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    completedMap.set(dateStr, 0)
    cancelledMap.set(dateStr, 0)
    scheduledMap.set(dateStr, 0)
  }

  // Contar sessões por status e data
  sessions.forEach((session) => {
    const dateStr = new Date(session.date).toISOString().split("T")[0]

    if (session.status === "completed") {
      completedMap.set(dateStr, (completedMap.get(dateStr) || 0) + 1)
    } else if (session.status === "cancelled") {
      cancelledMap.set(dateStr, (cancelledMap.get(dateStr) || 0) + 1)
    } else if (session.status === "scheduled") {
      scheduledMap.set(dateStr, (scheduledMap.get(dateStr) || 0) + 1)
    }
  })

  // Ordenar datas
  const sortedDates = Array.from(completedMap.keys()).sort()

  // Formatar datas para exibição
  sortedDates.forEach((dateStr) => {
    const date = new Date(dateStr)
    labels.push(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }))
    completedData.push(completedMap.get(dateStr) || 0)
    cancelledData.push(cancelledMap.get(dateStr) || 0)
    scheduledData.push(scheduledMap.get(dateStr) || 0)
  })

  return {
    labels,
    datasets: [
      {
        label: "Sessões Realizadas",
        data: completedData,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
      {
        label: "Sessões Canceladas",
        data: cancelledData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
      {
        label: "Sessões Agendadas",
        data: scheduledData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  }
}

function processScalesData(scales: any[]) {
  // Agrupar escalas por tipo
  const scaleTypes = new Map()

  scales.forEach((scale) => {
    const name = scale.scales?.name || "Desconhecida"
    scaleTypes.set(name, (scaleTypes.get(name) || 0) + 1)
  })

  // Preparar dados para o gráfico
  const labels = Array.from(scaleTypes.keys())
  const data = Array.from(scaleTypes.values())

  // Gerar cores para cada tipo de escala
  const backgroundColors = [
    "rgba(53, 162, 235, 0.5)",
    "rgba(255, 99, 132, 0.5)",
    "rgba(255, 206, 86, 0.5)",
    "rgba(75, 192, 192, 0.5)",
    "rgba(153, 102, 255, 0.5)",
    "rgba(255, 159, 64, 0.5)",
  ]

  return {
    labels,
    datasets: [
      {
        label: "Escalas Aplicadas",
        data,
        backgroundColor: backgroundColors.slice(0, labels.length),
      },
    ],
  }
}

function processActivitiesData(activities: any[], days: number) {
  // Gerar labels para o período (últimos X dias)
  const labels = []
  const completedData = []
  const scheduledData = []

  // Criar mapa de datas para contagem
  const completedMap = new Map()
  const scheduledMap = new Map()

  // Inicializar mapa com zeros
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    completedMap.set(dateStr, 0)
    scheduledMap.set(dateStr, 0)
  }

  // Contar atividades por status e data
  activities.forEach((activity) => {
    const dateStr = new Date(activity.created_at).toISOString().split("T")[0]

    if (activity.status === "completed") {
      completedMap.set(dateStr, (completedMap.get(dateStr) || 0) + 1)
    } else if (activity.status === "scheduled") {
      scheduledMap.set(dateStr, (scheduledMap.get(dateStr) || 0) + 1)
    }
  })

  // Ordenar datas
  const sortedDates = Array.from(completedMap.keys()).sort()

  // Formatar datas para exibição
  sortedDates.forEach((dateStr) => {
    const date = new Date(dateStr)
    labels.push(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }))
    completedData.push(completedMap.get(dateStr) || 0)
    scheduledData.push(scheduledMap.get(dateStr) || 0)
  })

  return {
    labels,
    datasets: [
      {
        label: "Atividades Concluídas",
        data: completedData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
      {
        label: "Atividades Agendadas",
        data: scheduledData,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  }
}
