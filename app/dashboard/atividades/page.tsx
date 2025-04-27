import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, ArrowUpDown, Eye, Edit, Trash, Calendar, CheckCircle } from "lucide-react"

export default function AtividadesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atividades</h1>
          <p className="text-muted-foreground">Gerencie o cronograma de atividades prazerosas dos pacientes</p>
        </div>
        <Link href="/dashboard/atividades/nova">
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            Nova Atividade
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as atividades por paciente, data ou status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar atividade..." className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
              <Button variant="outline" className="gap-1">
                <ArrowUpDown className="h-4 w-4" />
                Ordenar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Lista de atividades registradas recentemente</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  paciente: "Maria Oliveira",
                  atividade: "Caminhada no parque",
                  data: "15/04/2023",
                  status: "Concluída",
                },
                {
                  paciente: "João Silva",
                  atividade: "Leitura de livro",
                  data: "16/04/2023",
                  status: "Pendente",
                },
                {
                  paciente: "Ana Santos",
                  atividade: "Meditação guiada",
                  data: "14/04/2023",
                  status: "Concluída",
                },
                {
                  paciente: "Carlos Pereira",
                  atividade: "Aula de yoga",
                  data: "18/04/2023",
                  status: "Pendente",
                },
                {
                  paciente: "Lúcia Ferreira",
                  atividade: "Pintura",
                  data: "20/04/2023",
                  status: "Pendente",
                },
              ].map((atividade, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{atividade.paciente}</TableCell>
                  <TableCell>{atividade.atividade}</TableCell>
                  <TableCell>{atividade.data}</TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        atividade.status === "Concluída"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                      }`}
                    >
                      {atividade.status === "Concluída" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      {atividade.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver</span>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
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
        </CardContent>
      </Card>
    </div>
  )
}
