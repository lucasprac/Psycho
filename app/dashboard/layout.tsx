import type { ReactNode } from "react"
import Link from "next/link"
import { Brain, ClipboardList, BarChart, Calendar, Users, Settings, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { LogoutButton } from "@/components/logout-button"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
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
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <BarChart className="h-5 w-5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/dashboard/sessoes">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Sessões
                    </Button>
                  </Link>
                  <Link href="/dashboard/escalas">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <BarChart className="h-5 w-5" />
                      Escalas
                    </Button>
                  </Link>
                  <Link href="/dashboard/atividades">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Calendar className="h-5 w-5" />
                      Atividades
                    </Button>
                  </Link>
                  <Link href="/dashboard/pacientes">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Users className="h-5 w-5" />
                      Pacientes
                    </Button>
                  </Link>
                  <Link href="/dashboard/configuracoes">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Settings className="h-5 w-5" />
                      Configurações
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center gap-2">
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
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <BarChart className="h-5 w-5" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/sessoes">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Sessões
                </Button>
              </Link>
              <Link href="/dashboard/escalas">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <BarChart className="h-5 w-5" />
                  Escalas
                </Button>
              </Link>
              <Link href="/dashboard/atividades">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Calendar className="h-5 w-5" />
                  Atividades
                </Button>
              </Link>
              <Link href="/dashboard/pacientes">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Users className="h-5 w-5" />
                  Pacientes
                </Button>
              </Link>
              <Link href="/dashboard/configuracoes">
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
