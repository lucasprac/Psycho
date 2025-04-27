import { NextResponse } from "next/server"
import { z } from "zod"
import { createUser, findUserByEmail } from "@/lib/db"

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  userType: z.enum(["psicologo", "paciente"]),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const result = userSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 })
    }

    const { name, email, password, userType } = result.data

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Create user
    await createUser(name, email, password, userType)

    return NextResponse.json({ success: true, message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
