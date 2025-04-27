import { type NextRequest, NextResponse } from "next/server"
import { getActiveScalesServer } from "@/lib/services/scale-service"

export async function GET(request: NextRequest) {
  try {
    const scales = await getActiveScalesServer()
    
    // Add cache control headers to reduce unnecessary requests
    const response = NextResponse.json(scales)
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=60')
    
    return response
  } catch (error) {
    console.error("Erro ao buscar escalas:", error)

    // Verificar se é um erro de limite de requisições
    if (error instanceof Error && error.message.includes("Too Many Requests")) {
      const response = NextResponse.json(
        { error: "Limite de requisições excedido. Tente novamente mais tarde." },
        { status: 429 }
      )
      
      // Add retry-after header
      response.headers.set('Retry-After', '30')
      return response
    }

    return NextResponse.json({ error: "Erro ao buscar escalas" }, { status: 500 })
  }
}
