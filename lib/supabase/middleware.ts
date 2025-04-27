import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Log all environment variables that start with SUPABASE or NEXT_PUBLIC
  console.log("All Supabase related env vars:", {
    ...Object.entries(process.env)
      .filter(([key]) => key.includes('SUPABASE') || key.includes('NEXT_PUBLIC'))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  });

  // Check if required variables exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials:", {
      url: supabaseUrl ? "✅ Present" : "❌ Missing",
      key: supabaseKey ? "✅ Present" : "❌ Missing"
    });
    throw new Error("Missing Supabase credentials. Please check your .env.local file.");
  }

  let response = NextResponse.next({ request })

  const supabase = createMiddlewareClient({ req: request, res: response })

  // força revalidação do token no Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
} 