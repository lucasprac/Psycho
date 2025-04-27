import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Brain, ClipboardList, Calendar, BarChart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PsicoMonitor</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Registrar</Button>
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Plataforma de Monitoramento para Psicólogos
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Uma ferramenta completa para análise de dados clínicos, aplicação de escalas psicométricas e
                  acompanhamento de pacientes.
                </p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/register">
                    <Button size="lg" className="gap-1">
                      Começar agora
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline" className="gap-1">
                      Saiba mais
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Principais Funcionalidades
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Conheça os três módulos principais da nossa plataforma
                </p>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12 mt-8">
                <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                  <ClipboardList className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Transcrição e Análise Funcional</h3>
                  <p className="text-muted-foreground text-center">
                    Insira transcrições de sessões e receba sugestões baseadas em IA para identificar comportamentos e
                    padrões.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                  <BarChart className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Escalas Psicométricas</h3>
                  <p className="text-muted-foreground text-center">
                    Selecione escalas padronizadas ou crie escalas customizadas para avaliar seus pacientes.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                  <Calendar className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Registro de Pensamentos</h3>
                  <p className="text-muted-foreground text-center">
                    Permita que seus pacientes registrem pensamentos e organizem um cronograma de atividades prazerosas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold">PsicoMonitor</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2023 PsicoMonitor. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
