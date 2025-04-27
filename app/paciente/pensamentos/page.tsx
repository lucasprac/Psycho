import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, ArrowUpDown, Calendar, Edit, Trash } from "lucide-react"

export default function PensamentosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Pensamentos</h1>
          <p className="text-muted-foreground">Registre e acompanhe seus pensamentos e sentimentos</p>
        </div>
        <Link href="/paciente/pensamentos/novo">
          <Button className="gap-1">
            <Plus className="h-4 w-4" />
            Novo Registro
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre seus registros por data ou sentimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar registro..." className="pl-8" />
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

      <div className="space-y-4">
        {[
          {
            data: "15/04/2023, 10:30",
            pensamento:
              "Estou preocupada com a apresentação de amanhã no trabalho. Sinto que não estou preparada o suficiente e que vou falhar.",
            situacao: "Preparando a apresentação para a reunião de equipe",
            sentimentos: "Ansiedade, medo, tensão no estômago",
            crenca: 8,
          },
          {
            data: "13/04/2023, 19:45",
            pensamento:
              "Minha amiga não respondeu minha mensagem. Ela deve estar chateada comigo por algo que eu disse.",
            situacao: "Enviando mensagem para uma amiga",
            sentimentos: "Preocupação, culpa, aperto no peito",
            crenca: 7,
          },
          {
            data: "10/04/2023, 08:15",
            pensamento:
              "Não vou conseguir dar conta de todas as tarefas hoje. Estou sobrecarregada e vou decepcionar as pessoas.",
            situacao: "Olhando a lista de tarefas do dia",
            sentimentos: "Estresse, desânimo, dor de cabeça",
            crenca: 9,
          },
        ].map((registro, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <CardDescription>{registro.data}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Pensamento:</h3>
                <p className="text-sm">{registro.pensamento}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-1">Situação:</h3>
                  <p className="text-sm">{registro.situacao}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Sentimentos físicos:</h3>
                  <p className="text-sm">{registro.sentimentos}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-1">Nível de crença (0-10):</h3>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${registro.crenca * 10}%` }}></div>
                  </div>
                  <span className="text-sm font-medium">{registro.crenca}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
