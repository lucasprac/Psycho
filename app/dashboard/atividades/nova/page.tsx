import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function NovaAtividadePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Atividade</h1>
        <p className="text-muted-foreground">Registre uma nova atividade prazerosa para o paciente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Atividade</CardTitle>
          <CardDescription>Preencha os dados da atividade a ser realizada</CardDescription>
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
            <Label htmlFor="titulo">Título da Atividade</Label>
            <Input id="titulo" placeholder="Ex: Caminhada no parque" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" placeholder="Descreva os detalhes da atividade..." className="min-h-[100px]" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input id="hora" type="time" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao">Duração (minutos)</Label>
            <Input id="duracao" type="number" min="5" step="5" defaultValue="30" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select>
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fisica">Atividade Física</SelectItem>
                <SelectItem value="lazer">Lazer</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="relaxamento">Relaxamento</SelectItem>
                <SelectItem value="criativa">Criativa</SelectItem>
                <SelectItem value="outra">Outra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Opções</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="lembrete" />
                <Label htmlFor="lembrete">Enviar lembrete</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="recorrente" />
                <Label htmlFor="recorrente">Atividade recorrente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="feedback" />
                <Label htmlFor="feedback">Solicitar feedback após conclusão</Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancelar</Button>
          <Button>Salvar Atividade</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
