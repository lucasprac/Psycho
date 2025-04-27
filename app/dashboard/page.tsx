"use client"

import { StatsCards } from "@/components/dashboard/stats-cards"
import { PatientListCard } from "@/components/dashboard/patient-list-card"
import { SessionsCalendar } from "@/components/dashboard/sessions-calendar"
import { ProgressCharts } from "@/components/dashboard/progress-charts"
import { NotificationsCard } from "@/components/dashboard/notifications-card"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  useDashboardStats,
  useActivePatients,
  useSessions,
  useNotifications,
  useChartData,
} from "@/hooks/use-dashboard-data"

export default function DashboardPage() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState("30")

  // Buscar dados do dashboard
  const { stats, isLoading: isLoadingStats, error: statsError } = useDashboardStats()
  const { patients, isLoading: isLoadingPatients, error: patientsError } = useActivePatients()
  const { sessions, isLoading: isLoadingSessions, error: sessionsError } = useSessions()
  const {
    notifications,
    isLoading: isLoadingNotifications,
    error: notificationsError,
    markAsRead,
    markAllAsRead,
  } = useNotifications()
  const { chartData, isLoading: isLoadingChartData, error: chartDataError } = useChartData(timeRange)

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao seu painel de controle, {user?.name || "Dr."}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatsCards stats={stats} isLoading={isLoadingStats} error={statsError} />

        <PatientListCard patients={patients} isLoading={isLoadingPatients} error={patientsError} />

        <NotificationsCard
          notifications={notifications}
          isLoading={isLoadingNotifications}
          error={notificationsError}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
        />

        <SessionsCalendar sessions={sessions} isLoading={isLoadingSessions} error={sessionsError} />

        <ProgressCharts
          sessionsData={chartData?.sessionsData}
          scalesData={chartData?.scalesData}
          activitiesData={chartData?.activitiesData}
          isLoading={isLoadingChartData}
          error={chartDataError}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>
    </div>
  )
}
