"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Clock, CalendarIcon, Plus } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

// Modifique a interface Session para refletir que time é derivado de date
type Session = {
  id: string
  patientId: string
  patientName: string
  date: Date
  time: string // Agora derivado da data
  duration: number
  status: "scheduled" | "completed" | "cancelled"
}

interface SessionsCalendarProps {
  sessions: Session[]
  isLoading?: boolean
  error?: Error | null
}

export function SessionsCalendar({ sessions, isLoading = false, error = null }: SessionsCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Função para verificar se uma data tem sessões
  const hasSessions = (day: Date) => {
    return sessions.some((session) => {
      const sessionDate = new Date(session.date)
      return (
        sessionDate.getDate() === day.getDate() &&
        sessionDate.getMonth() === day.getMonth() &&
        sessionDate.getFullYear() === day.getFullYear()
      )
    })
  }

  // Função para obter sessões de um dia específico
  const getSessionsForDay = (day: Date) => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.date)
      return (
        sessionDate.getDate() === day.getDate() &&
        sessionDate.getMonth() === day.getMonth() &&
        sessionDate.getFullYear() === day.getFullYear()
      )
    })
  }

  // Função para formatar a data
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  // Função para abrir o diálogo com detalhes da sessão
  const openSessionDetails = (session: Session) => {
    setSelectedSession(session)
    setIsDialogOpen(true)
  }

  // Sessões do dia selecionado
  const selectedDaySessions = date ? getSessionsForDay(date) : []

  if (error) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Calendário de Sessões</CardTitle>
          <CardDescription>Visualize e gerencie suas sessões agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-destructive">Erro ao carregar sessões: {error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Calendário de Sessões</CardTitle>
          <CardDescription>Visualize e gerencie suas sessões agendadas</CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/sessoes/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Sessão
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{
                hasSessions: (day) => hasSessions(day),
              }}
              modifiersStyles={{
                hasSessions: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  color: "hsl(var(--primary))",
                },
              }}
            />
          )}
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-md border p-4">
            <h3 className="font-medium">{date ? formatDate(date) : "Selecione uma data"}</h3>
            {isLoading ? (
              <div className="mt-4 space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
              </div>
            ) : selectedDaySessions.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Ainda não disponível para este dia.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {selectedDaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex -pointer items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                    onClick={() => openSessionDetails(session)}
                  >
                    <div>
                      <p className="font-medium">{session.patientName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {session.time} ({session.duration} min)
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={
                        session.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : session.status === "cancelled"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      }
                    >
                      {session.status === "completed"
                        ? "Concluída"
                        : session.status === "cancelled"
                          ? "Cancelada"
                          : "Agendada"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Diálogo de detalhes da sessão */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Sessão</DialogTitle>
            <DialogDescription>Informações sobre a sessão agendada</DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Paciente</h4>
                  <p>{selectedSession.patientName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <Badge
                    className={
                      selectedSession.status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : selectedSession.status === "cancelled"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                    }
                  >
                    {selectedSession.status === "completed"
                      ? "Concluída"
                      : selectedSession.status === "cancelled"
                        ? "Cancelada"
                        : "Agendada"}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Data</h4>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedSession.date)}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Horário</h4>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedSession.time} ({selectedSession.duration} min)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fechar
                </Button>
                <Button asChild>
                  <Link href={`/dashboard/sessoes/${selectedSession.id}`}>Ver detalhes completos</Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
