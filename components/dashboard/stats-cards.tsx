"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, LineChart, ListChecks } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsCardsProps {
  stats: {
    totalPatients: number
    patientsTrend: number
    completedSessions: number
    sessionsTrend: number
    appliedScales: number
    scalesTrend: number
    scheduledActivities: number
    activitiesTrend: number
  }
  isLoading?: boolean
  error?: Error | null
}

export function StatsCards({ stats, isLoading = false, error = null }: StatsCardsProps) {
  if (error) {
    return (
      <>
        {Array(4)
          .fill(0)
          .map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-destructive text-sm">Erro ao carregar estatísticas</div>
              </CardContent>
            </Card>
          ))}
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.totalPatients || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.patientsTrend > 0 ? (
                  <span className="text-green-600">+{stats.patientsTrend}</span>
                ) : (
                  <span>Nenhum novo</span>
                )}{" "}
                no último mês
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.completedSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.sessionsTrend > 0 ? (
                  <span className="text-green-600">+{stats.sessionsTrend}</span>
                ) : (
                  <span>Nenhuma</span>
                )}{" "}
                na última semana
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Escalas Aplicadas</CardTitle>
          <LineChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.appliedScales || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.scalesTrend > 0 ? (
                  <span className="text-green-600">+{stats.scalesTrend}</span>
                ) : (
                  <span>Nenhuma</span>
                )}{" "}
                na última semana
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Atividades Agendadas</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.scheduledActivities || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activitiesTrend > 0 ? (
                  <span className="text-green-600">+{stats.activitiesTrend}</span>
                ) : (
                  <span>Nenhuma</span>
                )}{" "}
                no último mês
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
