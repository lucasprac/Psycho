import { type NextRequest, NextResponse } from "next/server"
import { getScaleByIdServer } from "@/lib/services/scale-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const scaleId = params.id
    const scale = await getScaleByIdServer(scaleId)

    if (!scale) {
      return NextResponse.json({ error: "Escala não encontrada" }, { status: 404 })
    }

    return NextResponse.json(scale)
  } catch (error) {
    console.error("Erro ao buscar escala:", error)
    return NextResponse.json({ error: "Erro ao buscar escala" }, { status: 500 })
  }
}
