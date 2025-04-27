import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, ArrowUpDown, Eye, Edit, Trash } from "lucide-react"

export default function SessoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessões</h1>
          <p className="text-muted-foreground">Gerencie as transcrições e análises de sessões</p>
        </div>
        <Link href="/dashboard/sessoes/nova">
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as sessões por paciente, data ou status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por paciente..." className="pl-8" />
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
          <CardTitle>Sessões Recentes</CardTitle>
          <CardDescription>Lista de sessões registradas recentemente</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Palavras-chave</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  paciente: "Maria Oliveira",
                  data: "15/04/2023",
                  status: "Analisada",
                  palavras: ["ansiedade", "controle", "família"],
                },
                {
                  paciente: "João Silva",
                  data: "14/04/2023",
                  status: "Pendente",
                  palavras: ["trabalho", "estresse", "sono"],
                },
                {
                  paciente: "Ana Santos",
                  data: "12/04/2023",
                  status: "Analisada",
                  palavras: ["relacionamento", "conflito", "comunicação"],
                },
                {
                  paciente: "Carlos Pereira",
                  data: "10/04/2023",
                  status: "Analisada",
                  palavras: ["depressão", "isolamento", "motivação"],
                },
                {
                  paciente: "Lúcia Ferreira",
                  data: "08/04/2023",
                  status: "Pendente",
                  palavras: ["autoestima", "imagem", "aceitação"],
                },
              ].map((sessao, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{sessao.paciente}</TableCell>
                  <TableCell>{sessao.data}</TableCell>
                  <TableCell>
                    <div
                      className={`inline-block text-xs px-2 py-1 rounded-full ${
                        sessao.status === "Analisada"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                      }`}
                    >
                      {sessao.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {sessao.palavras.map((palavra, i) => (
                        <span
                          key={i}
                          className="inline-block text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full"
                        >
                          {palavra}
                        </span>
                      ))}
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
