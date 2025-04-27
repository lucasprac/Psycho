import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash } from "lucide-react"

export default function NovaEscalaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Escala</h1>
        <p className="text-muted-foreground">Crie uma nova escala psicométrica ou selecione uma existente</p>
      </div>

      <Tabs defaultValue="criar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="criar">Criar Escala Customizada</TabsTrigger>
          <TabsTrigger value="selecionar">Selecionar Escala Padronizada</TabsTrigger>
        </TabsList>

        <TabsContent value="criar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Defina as informações básicas da escala</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Escala</Label>
                <Input id="nome" placeholder="Ex: Avaliação de Comportamentos Diários" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o objetivo e as instruções para preenchimento da escala..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Escala</Label>
                <Select>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo de escala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="likert">Escala Likert (1-5)</SelectItem>
                    <SelectItem value="likert7">Escala Likert (1-7)</SelectItem>
                    <SelectItem value="binaria">Binária (Sim/Não)</SelectItem>
                    <SelectItem value="aberta">Perguntas Abertas</SelectItem>
                    <SelectItem value="mista">Mista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perguntas</CardTitle>
              <CardDescription>Adicione as perguntas que farão parte da escala</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2].map((pergunta) => (
                <div key={pergunta} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Pergunta {pergunta}</h3>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`pergunta-${pergunta}`}>Texto da Pergunta</Label>
                    <Input
                      id={`pergunta-${pergunta}`}
                      placeholder="Digite a pergunta..."
                      defaultValue={
                        pergunta === 1 ? "Com que frequência você se sente ansioso em situações sociais?" : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`tipo-${pergunta}`}>Tipo de Resposta</Label>
                    <Select defaultValue={pergunta === 1 ? "likert" : ""}>
                      <SelectTrigger id={`tipo-${pergunta}`}>
                        <SelectValue placeholder="Selecione o tipo de resposta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="likert">Escala Likert (1-5)</SelectItem>
                        <SelectItem value="likert7">Escala Likert (1-7)</SelectItem>
                        <SelectItem value="binaria">Binária (Sim/Não)</SelectItem>
                        <SelectItem value="aberta">Resposta Aberta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {pergunta === 1 && (
                    <div className="space-y-2">
                      <Label>Opções de Resposta</Label>
                      <div className="grid grid-cols-5 gap-2 text-center text-sm">
                        <div className="p-2 border rounded">1 - Nunca</div>
                        <div className="p-2 border rounded">2 - Raramente</div>
                        <div className="p-2 border rounded">3 - Às vezes</div>
                        <div className="p-2 border rounded">4 - Frequentemente</div>
                        <div className="p-2 border rounded">5 - Sempre</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Button variant="outline" className="w-full gap-1">
                <Plus className="h-4 w-4" />
                Adicionar Pergunta
              </Button>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancelar</Button>
              <Button>Salvar Escala</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="selecionar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Escala Padronizada</CardTitle>
              <CardDescription>Escolha uma escala padronizada para aplicar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="escala-padronizada">Escala</Label>
                <Select>
                  <SelectTrigger id="escala-padronizada">
                    <SelectValue placeholder="Selecione uma escala padronizada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beck-ansiedade">Escala de Ansiedade de Beck</SelectItem>
                    <SelectItem value="hamilton-depressao">Escala de Depressão de Hamilton</SelectItem>
                    <SelectItem value="beck-depressao">Inventário de Depressão de Beck</SelectItem>
                    <SelectItem value="estresse-percebido">Escala de Estresse Percebido</SelectItem>
                    <SelectItem value="qualidade-vida">Escala de Qualidade de Vida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                <Label>Periodicidade</Label>
                <RadioGroup defaultValue="unica">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unica" id="unica" />
                    <Label htmlFor="unica">Aplicação única</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="semanal" id="semanal" />
                    <Label htmlFor="semanal">Semanal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quinzenal" id="quinzenal" />
                    <Label htmlFor="quinzenal">Quinzenal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mensal" id="mensal" />
                    <Label htmlFor="mensal">Mensal</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancelar</Button>
              <Button>Enviar Escala</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
