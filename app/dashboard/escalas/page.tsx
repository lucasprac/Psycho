"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, FileText, ArrowUpDown, Filter, Eye, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Skeleton } from "@/components/ui/skeleton"
import type { Scale } from "@/lib/types/scales"
import { getActiveScales } from "@/lib/services/scale-service"

export default function EscalasPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [scales, setScales] = useState<Scale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    async function fetchScales() {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const data = await getActiveScales()
        setScales(data)
      } catch (err) {
        console.error("Erro ao buscar escalas:", err)

        // Verificar se é um erro de limite de requisições
        if (err instanceof Error && err.message.includes("Limite de requisições excedido")) {
          setError("Limite de requisições excedido. Tente novamente mais tarde.")
        } else {
          setError("Não foi possível carregar a lista de escalas.")
        }

        toast({
          title: "Erro",
          description: err instanceof Error ? err.message : "Não foi possível carregar a lista de escalas.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchScales()
  }, [user, toast, retryCount])

  // Filtrar escalas com base na busca
  const filteredScales = scales.filter(
    (scale) =>
      scale.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scale.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escalas Psicométricas</h1>
          <p className="text-muted-foreground">Gerencie e aplique escalas psicométricas aos seus pacientes</p>
        </div>
        <Link href="/dashboard/escalas/aplicar">
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            Aplicar Escala
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as escalas por nome ou descrição</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar escala..."
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
          <CardTitle>Escalas Disponíveis</CardTitle>
          <CardDescription>
            {scales.length > 0
              ? `${scales.length} escalas disponíveis para aplicação`
              : "Nenhuma escala disponível ainda"}
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
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRetry}>Tentar Novamente</Button>
            </div>
          ) : filteredScales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhuma escala encontrada para esta busca" : "Nenhuma escala disponível ainda"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScales.map((scale) => (
                  <TableRow key={scale.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{scale.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{scale.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/escalas/${scale.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/escalas/aplicar?scale=${scale.id}`}>
                            <Plus className="h-4 w-4 mr-1" />
                            Aplicar
                          </Link>
                        </Button>
                      </div>
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
