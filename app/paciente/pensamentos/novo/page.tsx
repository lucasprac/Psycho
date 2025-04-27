import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"

export default function NovoPensamentoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Registro de Pensamento</h1>
        <p className="text-muted-foreground">Registre seus pensamentos, sentimentos e situações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Pensamento</CardTitle>
          <CardDescription>Preencha os campos abaixo para registrar seu pensamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pensamento">Pensamento</Label>
            <Textarea id="pensamento" placeholder="Descreva seu pensamento..." className="min-h-[100px]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="situacao">Situação</Label>
            <Textarea
              id="situacao"
              placeholder="Descreva a situação que desencadeou o pensamento..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sentimentos">Sentimentos físicos</Label>
            <Textarea
              id="sentimentos"
              placeholder="Descreva os sentimentos físicos associados (ex: coração acelerado, tensão muscular)..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crenca">Nível de crença no pensamento (0-10)</Label>
            <div className="pt-2">
              <Slider defaultValue={[5]} max={10} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anotacoes">Anotações adicionais (opcional)</Label>
            <Textarea
              id="anotacoes"
              placeholder="Adicione qualquer informação adicional que considere relevante..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancelar</Button>
          <Button>Salvar Registro</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
