"use client"

import { Button } from "@/components/ui/button"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Importamos o React Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"

// Registramos os componentes necessários
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface ProgressChartsProps {
  sessionsData: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
  scalesData: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string | string[]
    }[]
  }
  activitiesData: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
  isLoading?: boolean
  error?: Error | null
  onTimeRangeChange?: (range: string) => void
}

export function ProgressCharts({
  sessionsData,
  scalesData,
  activitiesData,
  isLoading = false,
  error = null,
  onTimeRangeChange,
}: ProgressChartsProps) {
  const [timeRange, setTimeRange] = useState("30")

  // Opções comuns para os gráficos
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    if (onTimeRangeChange) {
      onTimeRangeChange(value)
    }
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Progresso dos Pacientes</CardTitle>
          <CardDescription>Visualize o progresso e engajamento dos seus pacientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-destructive">Erro ao carregar dados de progresso: {error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Progresso dos Pacientes</CardTitle>
          <CardDescription>Visualize o progresso e engajamento dos seus pacientes</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={handleTimeRangeChange} disabled={isLoading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 3 meses</SelectItem>
            <SelectItem value="180">Últimos 6 meses</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sessions">
          <TabsList className="mb-4">
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="scales">Escalas</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
          </TabsList>
          {isLoading ? (
            <div className="h-80">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <>
              <TabsContent value="sessions" className="h-80">
                <Line options={chartOptions} data={sessionsData} />
              </TabsContent>
              <TabsContent value="scales" className="h-80">
                <Bar options={chartOptions} data={scalesData} />
              </TabsContent>
              <TabsContent value="activities" className="h-80">
                <Line options={chartOptions} data={activitiesData} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
