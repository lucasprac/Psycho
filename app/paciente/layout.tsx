import type { ReactNode } from "react"
import Link from "next/link"
import { Brain, ClipboardList, Calendar, Settings, Menu, X, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { LogoutButton } from "@/components/logout-button"

interface PacienteLayoutProps {
  children: ReactNode
}

export default function PacienteLayout({ children }: PacienteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex items-center gap-2 mb-8">
                  <Brain className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">PsicoMonitor</span>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex flex-col gap-2">
                  <Link href="/paciente">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Calendar className="h-5 w-5" />
                      Atividades
                    </Button>
                  </Link>
                  <Link href="/paciente/pensamentos">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <PenLine className="h-5 w-5" />
                      Pensamentos
                    </Button>
                  </Link>
                  <Link href="/paciente/escalas">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Escalas
                    </Button>
                  </Link>
                  <Link href="/paciente/configuracoes">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Settings className="h-5 w-5" />
                      Configurações
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/paciente" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold hidden md:inline-block">PsicoMonitor</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-background md:block">
          <div className="flex h-full flex-col gap-2 p-4">
            <nav className="flex flex-col gap-2">
              <Link href="/paciente">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Calendar className="h-5 w-5" />
                  Atividades
                </Button>
              </Link>
              <Link href="/paciente/pensamentos">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <PenLine className="h-5 w-5" />
                  Pensamentos
                </Button>
              </Link>
              <Link href="/paciente/escalas">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Escalas
                </Button>
              </Link>
              <Link href="/paciente/configuracoes">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações
                </Button>
              </Link>
            </nav>
          </div>
        </aside>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
