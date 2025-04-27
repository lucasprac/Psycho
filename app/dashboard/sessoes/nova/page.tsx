import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Wand2 } from "lucide-react"

export default function NovaSessaoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Sessão</h1>
        <p className="text-muted-foreground">Registre uma nova transcrição de sessão para análise</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Sessão</CardTitle>
              <CardDescription>Preencha os dados básicos da sessão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paciente">Paciente</Label>
                <Select>
                  <SelectTrigger id="paciente">
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maria">Maria Oliveira</SelectItem>
                    <SelectItem value="joao">João Silva</SelectItem>
                    <SelectItem value="ana">Ana Santos</SelectItem>
                    <SelectItem value="carlos">Carlos Pereira</SelectItem>
                    <SelectItem value="lucia">Lúcia Ferreira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data da Sessão</Label>
                <Input id="data" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração (minutos)</Label>
                <Input id="duracao" type="number" min="15" step="5" defaultValue="50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Palavras-chave</CardTitle>
              <CardDescription>Adicione palavras-chave para direcionar a análise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Adicionar palavra-chave..." />
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Adicionar</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {["ansiedade", "controle", "família", "trabalho", "relacionamento"].map((palavra, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pl-2">
                    {palavra}
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:bg-transparent">
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="md:row-span-2">
          <CardHeader>
            <CardTitle>Transcrição da Sessão</CardTitle>
            <CardDescription>Insira a transcrição completa da sessão para análise</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Insira aqui a transcrição da sessão..." className="min-h-[400px]" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancelar</Button>
            <Button className="gap-1">
              <Wand2 className="h-4 w-4" />
              Analisar Sessão
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
