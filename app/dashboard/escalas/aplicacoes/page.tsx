"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, ArrowUpDown, Filter, Eye, Clock, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getPsychologistScaleApplications, updateExpiredApplications } from "@/lib/services/scale-service"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ScaleApplication } from "@/lib/types/scales"

export default function AplicacoesEscalasPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [applications, setApplications] = useState<ScaleApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchApplications() {
      if (!user) return

      setIsLoading(true)

      try {
        // Verificar e atualizar aplicações vencidas
        await updateExpiredApplications()

        // Buscar aplicações de escalas
        const data = await getPsychologistScaleApplications(user.id)
        setApplications(data)
      } catch (err) {
        console.error("Erro ao buscar aplicações de escalas:", err)
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de aplicações de escalas.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplications()
  }, [user, toast])

  // Filtrar aplicações com base na busca
  const filteredApplications = applications.filter(
    (app) =>
      app.scale?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aplicações de Escalas</h1>
          <p className="text-muted-foreground">Gerencie as escalas aplicadas aos seus pacientes</p>
        </div>
        <Link href="/dashboard/escalas/aplicar">
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            Nova Aplicação
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as aplicações por escala, paciente ou status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar aplicação..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1" disabled={isLoading}>
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
              <Button variant="outline" className="gap-1" disabled={isLoading}>
                <ArrowUpDown className="h-4 w-4" />
                Ordenar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aplicações de Escalas</CardTitle>
          <CardDescription>
            {applications.length > 0
              ? `${applications.length} aplicações de escalas`
              : "Nenhuma aplicação de escala encontrada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border-b last:border-0">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Nenhuma aplicação encontrada para esta busca"
                  : "Nenhuma aplicação de escala encontrada"}
              </p>
              {!searchQuery && (
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/dashboard/escalas/aplicar">Aplicar Escala</Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escala</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.scale?.name}</p>
                        <p className="text-xs text-muted-foreground">Criada em {formatDate(app.created_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{app.patient?.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={isPastDue(app.due_date) && app.status === "pending" ? "text-destructive" : ""}>
                          {formatDate(app.due_date)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          app.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : app.status === "expired"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                              : isPastDue(app.due_date)
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        }
                      >
                        {app.status === "completed"
                          ? "Concluída"
                          : app.status === "expired"
                            ? "Expirada"
                            : isPastDue(app.due_date)
                              ? "Atrasada"
                              : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/escalas/aplicacoes/${app.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
