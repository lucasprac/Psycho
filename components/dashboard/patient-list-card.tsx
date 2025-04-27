"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, AlertCircle, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type Patient = {
  id: string
  name: string
  pendingActivities: number
  pendingScales: number
  lastSession: string
  status: "active" | "inactive"
}

interface PatientListCardProps {
  patients: Patient[]
  isLoading?: boolean
  error?: Error | null
}

export function PatientListCard({ patients, isLoading = false, error = null }: PatientListCardProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Garantir que patients é sempre um array
  const safePatients = Array.isArray(patients) ? patients : []

  const filteredPatients = safePatients.filter(
    (patient) => patient.name && patient.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (error) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Pacientes Ativos</CardTitle>
          <CardDescription>Lista de pacientes e suas atividades pendentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-destructive">Erro ao carregar pacientes: {error.message}</p>
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
          <CardTitle>Pacientes Ativos</CardTitle>
          <CardDescription>Lista de pacientes e suas atividades pendentes</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/pacientes">Ver todos</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar paciente..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">Nenhum paciente encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${patient.name?.charAt(0) || "?"}`} />
                    <AvatarFallback>{patient.name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{patient.name || "Ainda não disponível"}</p>
                      {patient.status === "inactive" && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Última sessão: {patient.lastSession || "Ainda não disponível"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(patient.pendingActivities || 0) > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {patient.pendingActivities || 0} atividades
                        </Badge>
                      )}
                      {(patient.pendingScales || 0) > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {patient.pendingScales || 0} escalas
                        </Badge>
                      )}
                      {(patient.pendingActivities || 0) === 0 && (patient.pendingScales || 0) === 0 && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Em dia
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/pacientes/${patient.id}`}>Detalhes</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
