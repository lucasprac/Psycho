import { NextResponse } from "next/server"
import { getScaleApplicationByIdServer } from "@/lib/services/scale-service"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const application = await getScaleApplicationByIdServer(id)

    if (!application) {
      return NextResponse.json({ error: "Aplicação não encontrada" }, { status: 404 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Erro ao buscar aplicação:", error)
    return NextResponse.json({ error: "Erro ao buscar aplicação" }, { status: 500 })
  }
}
