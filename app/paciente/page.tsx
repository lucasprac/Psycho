import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { CheckCircle, Clock, Plus, ArrowRight } from "lucide-react"

export default function PacientePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Olá, Maria!</h1>
        <p className="text-muted-foreground">Bem-vinda à sua área de paciente</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Atividades</CardTitle>
            <CardDescription>Atividades agendadas para os próximos dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  titulo: "Caminhada no parque",
                  data: "Hoje, 08:30",
                  duracao: "30 min",
                  categoria: "Atividade Física",
                },
                {
                  titulo: "Meditação guiada",
                  data: "Amanhã, 07:15",
                  duracao: "15 min",
                  categoria: "Relaxamento",
                },
                {
                  titulo: "Leitura de livro",
                  data: "Quinta, 19:00",
                  duracao: "45 min",
                  categoria: "Lazer",
                },
              ].map((atividade, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{atividade.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{atividade.data}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        {atividade.duracao}
                      </span>
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                        {atividade.categoria}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="icon">
                    <CheckCircle className="h-4 w-4" />
                    <span className="sr-only">Marcar como concluída</span>
                  </Button>
                </div>
              ))}

              <Link href="/paciente/atividades/nova">
                <Button variant="outline" className="w-full gap-1">
                  <Plus className="h-4 w-4" />
                  Adicionar Atividade
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
            <CardDescription>Visualize suas atividades no calendário</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" className="rounded-md border" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Escalas Pendentes</CardTitle>
            <CardDescription>Escalas que precisam ser preenchidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  titulo: "Escala de Ansiedade de Beck",
                  descricao: "Avaliação do nível de ansiedade",
                  prazo: "Até 18/04/2023",
                },
                {
                  titulo: "Escala de Qualidade de Vida",
                  descricao: "Avaliação da qualidade de vida geral",
                  prazo: "Até 20/04/2023",
                },
              ].map((escala, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{escala.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{escala.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-2">{escala.prazo}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1">
                    Preencher
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Pensamentos</CardTitle>
            <CardDescription>Registre seus pensamentos e sentimentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                O registro de pensamentos é uma ferramenta importante para identificar padrões e trabalhar em sua saúde
                mental.
              </p>
              <p className="text-sm">Você registrou 3 pensamentos nos últimos 7 dias.</p>
              <Link href="/paciente/pensamentos/novo">
                <Button className="w-full gap-1">
                  <Plus className="h-4 w-4" />
                  Novo Registro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
