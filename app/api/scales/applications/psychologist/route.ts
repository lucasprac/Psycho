import { NextResponse } from "next/server"
import { getPsychologistScaleApplicationsServer } from "@/lib/services/scale-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const psychologistId = searchParams.get("psychologistId")

    if (!psychologistId) {
      return NextResponse.json({ error: "ID do psicólogo é obrigatório" }, { status: 400 })
    }

    const applications = await getPsychologistScaleApplicationsServer(psychologistId)
    return NextResponse.json(applications)
  } catch (error) {
    console.error("Erro ao buscar aplicações de escalas:", error)
    return NextResponse.json({ error: "Erro ao buscar aplicações de escalas" }, { status: 500 })
  }
}
