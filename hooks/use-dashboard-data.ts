"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { getSupabaseClient } from "@/lib/services/supabase-service"
import { useAuth } from "@/components/auth-provider"

// Hook para buscar estatísticas do dashboard
export function useDashboardData() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalSessions: 0,
    totalScales: 0,
    recentPatients: 0,
    recentSessions: 0,
    recentScales: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const getDashboardData = useCallback(async () => {
    if (!user?.id || !mounted.current) return

    try {
      const supabase = getSupabaseClient()
      const lastMonthIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const lastWeekIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      
      // Get only the date part for comparison
      const lastMonthDate = lastMonthIso.split('T')[0]
      const lastWeekDate = lastWeekIso.split('T')[0]

      // Parallelize queries
      const [
        { count: totalPatients, error: patientsError },
        { count: totalSessions, error: sessionsError },
        { count: totalScales, error: scalesError },
        { count: recentPatients, error: recentPatientsError },
        { count: recentSessions, error: recentSessionsError },
        { count: recentScales, error: recentScalesError }
      ] = await Promise.all([
        supabase
          .from("patients")
          .select("id", { count: "exact", head: true })
          .eq("psychologist_id", user.id),
        supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("psychologist_id", user.id),
        supabase
          .from("scale_applications")
          .select("id", { count: "exact", head: true })
          .eq("psychologist_id", user.id),
        supabase
          .from("patients")
          .select("id", { count: "exact", head: true })
          .eq("psychologist_id", user.id)
          .gte("created_at", lastMonthDate),
        supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("psychologist_id", user.id)
          .gte("created_at", lastWeekDate),
        supabase
          .from("scale_applications")
          .select("id", { count: "exact", head: true })
          .eq("psychologist_id", user.id)
          .gte("created_at", lastWeekDate)
      ])

      // Handle errors consistently
      const errors = [patientsError, sessionsError, scalesError, recentPatientsError, recentSessionsError, recentScalesError]
      const hasError = errors.some(error => error && error.code !== 'PGRST116')
      if (hasError) {
        throw new Error('Erro ao buscar dados do dashboard')
      }

      if (!mounted.current) return

      setStats({
        totalPatients: totalPatients || 0,
        totalSessions: totalSessions || 0,
        totalScales: totalScales || 0,
        recentPatients: recentPatients || 0,
        recentSessions: recentSessions || 0,
        recentScales: recentScales || 0
      })
    } catch (error) {
      if (!mounted.current) return
      console.error('Error fetching dashboard data:', error)
      setError(error instanceof Error ? error : new Error('Erro ao buscar dados do dashboard'))
    } finally {
      if (mounted.current) {
        setIsLoading(false)
      }
    }
  }, [user?.id])

  useEffect(() => {
    getDashboardData()
  }, [getDashboardData])

  return { stats, isLoading, error, refresh: getDashboardData }
}

// Hook para buscar pacientes ativos
export function useActivePatients() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPatients() {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Buscar pacientes ativos diretamente, sem usar a função RPC
        const { data: patientsData, error: patientsError } = await supabase
          .from("patients")
          .select(`
            id,
            status,
            created_at,
            users (
              id,
              name,
              email
            )
          `)
          .eq("psychologist_id", user.id)
          .order("status", { ascending: false })
          .limit(10)

        if (patientsError) throw patientsError

        if (!patientsData || patientsData.length === 0) {
          setPatients([])
          setIsLoading(false)
          return
        }

        // Para cada paciente, buscar informações adicionais
        const patientsWithDetails = await Promise.all(
          patientsData.map(async (patient) => {
            try {
              // Buscar última sessão
              const { data: lastSessionData, error: lastSessionError } = await supabase
                .from("sessions")
                .select("date")
                .eq("patient_id", patient.id)
                .order("date", { ascending: false })
                .limit(1)
                .maybeSingle()

              if (lastSessionError && lastSessionError.code !== "PGRST116") {
                console.error("Erro ao buscar última sessão:", lastSessionError)
              }

              // Buscar atividades pendentes
              const { count: pendingActivities, error: activitiesError } = await supabase
                .from("activities")
                .select("*", { count: "exact", head: true })
                .eq("patient_id", patient.id)
                .eq("status", "scheduled")

              if (activitiesError && activitiesError.code !== "PGRST116") {
                console.error("Erro ao buscar atividades pendentes:", activitiesError)
              }

              // Buscar escalas pendentes
              const { count: pendingScales, error: scalesError } = await supabase
                .from("scale_applications")
                .select("*", { count: "exact", head: true })
                .eq("patient_id", patient.id)
                .eq("status", "pending")

              if (scalesError && scalesError.code !== "PGRST116") {
                console.error("Erro ao buscar escalas pendentes:", scalesError)
              }

              // Formatar data da última sessão
              const lastSession = lastSessionData
                ? new Date(lastSessionData.date).toLocaleDateString("pt-BR")
                : "Nenhuma sessão"

              return {
                id: patient.id,
                name: patient.users?.name || "Nome não disponível",
                pendingActivities: pendingActivities || 0,
                pendingScales: pendingScales || 0,
                lastSession,
                status: patient.status,
              }
            } catch (err) {
              console.error("Erro ao processar detalhes do paciente:", err)
              // Retornar dados básicos em caso de erro
              return {
                id: patient.id,
                name: patient.users?.name || "Nome não disponível",
                pendingActivities: 0,
                pendingScales: 0,
                lastSession: "Erro ao carregar",
                status: patient.status,
              }
            }
          }),
        )

        setPatients(patientsWithDetails)
      } catch (err) {
        console.error("Erro ao buscar pacientes ativos:", err)
        setError(err instanceof Error ? err : new Error("Erro desconhecido ao buscar pacientes"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [user])

  return { patients, isLoading, error }
}

// Hook para buscar sessões
export function useSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchSessions() {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Buscar sessões diretamente, sem usar a função RPC
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`
            id,
            date,
            duration,
            status,
            patient_id,
            patients (
              users (
                name
              )
            )
          `)
          .eq("psychologist_id", user.id)
          .order("date", { ascending: true })

        if (sessionsError) throw sessionsError

        if (!sessionsData || sessionsData.length === 0) {
          setSessions([])
          setIsLoading(false)
          return
        }

        // Formatar dados das sessões
        const formattedSessions = sessionsData.map((session) => {
          // Extrair a hora da data completa
          const dateObj = new Date(session.date)
          const formattedTime = dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

          return {
            id: session.id,
            patientId: session.patient_id,
            patientName: session.patients?.users?.name || "Paciente desconhecido",
            date: dateObj,
            time: formattedTime,
            duration: session.duration || 0,
            status: session.status || "scheduled",
          }
        })

        setSessions(formattedSessions)
      } catch (err) {
        console.error("Erro ao buscar sessões:", err)
        setError(err instanceof Error ? err : new Error("Erro desconhecido ao buscar sessões"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [user])

  return { sessions, isLoading, error }
}

// Hook para buscar notificações
export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Buscar notificações
        const { data, error: notificationsError } = await supabase
          .from("notifications")
          .select("*")
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)

        if (notificationsError) throw notificationsError

        if (!data || data.length === 0) {
          setNotifications([])
          setIsLoading(false)
          return
        }

        // Formatar tempo das notificações
        const formattedNotifications = data.map((notification) => ({
          ...notification,
          time: formatNotificationTime(notification.created_at),
        }))

        setNotifications(formattedNotifications)
      } catch (err) {
        console.error("Erro ao buscar notificações:", err)
        setError(err instanceof Error ? err : new Error("Erro desconhecido ao buscar notificações"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  // Função para marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (error) throw error

      // Atualizar estado local
      setNotifications((prev: any[]) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      )

      return true
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err)
      throw err
    }
  }

  // Função para marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    if (!user) return false

    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_id", user.id)
        .eq("read", false)

      if (error) throw error

      // Atualizar estado local
      setNotifications((prev: any[]) => prev.map((notification) => ({ ...notification, read: true })))

      return true
    } catch (err) {
      console.error("Erro ao marcar todas notificações como lidas:", err)
      throw err
    }
  }

  return { notifications, isLoading, error, markAsRead, markAllAsRead }
}

// Hook para buscar dados para os gráficos
export function useChartData(timeRange = "30") {
  const { user } = useAuth()
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Add cache key based on user and time range
  const cacheKey = useMemo(() => `chart_data_${user?.id}_${timeRange}`, [user?.id, timeRange]);
  
  // Add a ref to track if we're mounting for the first time
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      // Clear previous data when parameters change
      setChartData(null);
    }
  }, [timeRange]);

  useEffect(() => {
    async function fetchChartData() {
      if (!user) return
      
      // Check if we have cached data
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheTime = parsed.timestamp;
          
          // Use cache if it's less than 5 minutes old
          if (Date.now() - cacheTime < 5 * 60 * 1000) {
            setChartData(parsed.data);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing cached data:", e);
          // Continue with the fetch if cache parsing fails
        }
      }

      setIsLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Calculate dates for filtering
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(timeRange))
        
        const startDateIso = startDate.toISOString()
        
        // Calculate days for chart labels
        const days = getDaysArray(startDate, endDate)
        
        // Create a map to store scale names
        const scaleNames = new Map()

        // Buscar dados de sessões
        const sessionsPromise = supabase
          .from("sessions")
          .select("date, status")
          .eq("psychologist_id", user.id)
          .gte("date", startDateIso.split("T")[0])
          .order("date", { ascending: true });

        // Buscar dados de escalas
        const scalesPromise = supabase
          .from("scale_applications")
          .select("scale_id, created_at")
          .eq("psychologist_id", user.id)
          .gte("created_at", startDateIso)
          .order("created_at", { ascending: true });
          
        // Buscar dados de atividades
        const activitiesPromise = supabase
          .from("activities")
          .select("created_at, status")
          .eq("psychologist_id", user.id)
          .gte("created_at", startDateIso)
          .order("created_at", { ascending: true });
          
        // Execute all queries in parallel
        const [
          sessionsResponse, 
          scalesResponse, 
          activitiesResponse
        ] = await Promise.all([
          sessionsPromise,
          scalesPromise,
          activitiesPromise
        ]);
        
        const sessionsData = sessionsResponse.data || [];
        const scalesData = scalesResponse.data || [];
        const activitiesData = activitiesResponse.data || [];
        
        // Check for errors in any of the responses
        if (sessionsResponse.error && sessionsResponse.error.code !== "PGRST116") 
          throw sessionsResponse.error;
        if (scalesResponse.error && scalesResponse.error.code !== "PGRST116") 
          throw scalesResponse.error;
        if (activitiesResponse.error && activitiesResponse.error.code !== "PGRST116") 
          throw activitiesResponse.error;

        // Fetch scale details only if we have scale data
        if (scalesData && scalesData.length > 0) {
          // Extract unique scale IDs
          const scaleIds = [...new Set(scalesData.map((item) => item.scale_id))]

          // Fetch scale details
          const { data: scalesDetails, error: scalesDetailsError } = await supabase
            .from("scales")
            .select("id, name")
            .in("id", scaleIds)

          if (scalesDetailsError) throw scalesDetailsError

          // Create ID to name map
          if (scalesDetails) {
            scalesDetails.forEach((scale) => {
              scaleNames.set(scale.id, scale.name)
            })
          }
        }

        // Process chart data
        const processedScalesData = processScalesData(scalesData, scaleNames)
        const processedSessionsData = processSessionsData(sessionsData, days)
        const processedActivitiesData = processActivitiesData(activitiesData, days)

        const newChartData = {
          sessionsData: processedSessionsData,
          scalesData: processedScalesData,
          activitiesData: processedActivitiesData,
        };
        
        setChartData(newChartData);
        
        // Store in session storage with timestamp
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: newChartData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error("Error caching chart data:", e);
          // Continue even if caching fails
        }
      } catch (err) {
        console.error("Erro ao buscar dados para gráficos:", err)
        setError(err instanceof Error ? err : new Error("Erro desconhecido ao buscar dados para gráficos"))
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
    fetchChartData()
    }
  }, [user, timeRange, cacheKey])

  return { chartData, isLoading, error }
}

// Funções auxiliares para processar dados dos gráficos
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

function processScalesData(scales: any[], scaleNames: Map<string, string>) {
  // Agrupar escalas por tipo
  const scaleTypes = new Map()

  scales.forEach((scale) => {
    const name = scaleNames.get(scale.scale_id) || "Desconhecida"
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

// Função auxiliar para formatar o tempo das notificações
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
