"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, ArrowUpDown, Eye, Edit, Trash, Mail, Phone } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getSupabaseClient } from "@/lib/services/supabase-service"
import { Skeleton } from "@/components/ui/skeleton"

type Patient = {
  id: string
  name: string
  email: string
  phone: string | null
  dateOfBirth: string | null
  status: "active" | "inactive"
  lastSession?: string
}

export default function PacientesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchPatients() {
      if (!user) return

      setIsLoading(true)

      try {
        const supabase = getSupabaseClient()

        // Buscar pacientes do psicólogo atual
        const { data, error } = await supabase
          .from("patients")
          .select(`
            id,
            status,
            date_of_birth,
            phone,
            users (
              id,
              name,
              email
            )
          `)
          .eq("psychologist_id", user.id)
          .order("status", { ascending: false })
          .order("users(name)", { ascending: true })

        if (error) throw error

        if (!data || data.length === 0) {
          setPatients([])
          setIsLoading(false)
          return
        }

        // Para cada paciente, buscar a última sessão
        const patientsWithLastSession = await Promise.all(
          data.map(async (patient) => {
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

              // Formatar data da última sessão
              const lastSession = lastSessionData
                ? new Date(lastSessionData.date).toLocaleDateString("pt-BR")
                : "Nenhuma sessão"

              return {
                id: patient.id,
                name: patient.users?.name || "Nome não disponível",
                email: patient.users?.email || "Email não disponível",
                phone: patient.phone,
                dateOfBirth: patient.date_of_birth,
                status: patient.status,
                lastSession,
              }
            } catch (err) {
              console.error("Erro ao processar detalhes do paciente:", err)
              return {
                id: patient.id,
                name: patient.users?.name || "Nome não disponível",
                email: patient.users?.email || "Email não disponível",
                phone: patient.phone,
                dateOfBirth: patient.date_of_birth,
                status: patient.status,
                lastSession: "Erro ao carregar",
              }
            }
          }),
        )

        setPatients(patientsWithLastSession)
      } catch (err) {
        console.error("Erro ao buscar pacientes:", err)
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de pacientes.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [user, toast])

  // Filtrar pacientes com base na busca
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie seus pacientes e seus dados</p>
        </div>
        <Link href="/dashboard/pacientes/novo">
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre os pacientes por nome, status ou data de cadastro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
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
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            {patients.length > 0 ? `${patients.length} pacientes cadastrados` : "Nenhum paciente cadastrado ainda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border-b last:border-0">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-2" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum paciente encontrado para esta busca" : "Nenhum paciente cadastrado ainda"}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/pacientes/novo" className="mt-4">
                  <Button>Cadastrar Paciente</Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Última Sessão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${patient.name.charAt(0)}`} />
                          <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{patient.name || "Ainda não disponível"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {patient.email || "Ainda não disponível"}
                        </p>
                        {patient.phone ? (
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </p>
                        ) : (
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Ainda não disponível
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{patient.lastSession || "Ainda não disponível"}</TableCell>
                    <TableCell>
                      <div
                        className={`inline-block text-xs px-2 py-1 rounded-full ${
                          patient.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {patient.status === "active" ? "Ativo" : "Inativo"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/pacientes/${patient.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/pacientes/${patient.id}/editar`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
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
