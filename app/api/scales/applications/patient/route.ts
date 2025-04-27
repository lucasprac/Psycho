import { NextResponse } from "next/server"
import { getPatientScaleApplicationsServer } from "@/lib/services/scale-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "ID do paciente é obrigatório" }, { status: 400 })
    }

    const applications = await getPatientScaleApplicationsServer(patientId)
    return NextResponse.json(applications)
  } catch (error) {
    console.error("Erro ao buscar aplicações de escalas:", error)
    return NextResponse.json({ error: "Erro ao buscar aplicações de escalas" }, { status: 500 })
  }
}
