import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { createToken } from "@/lib/auth"
import { validateUser, findUserByEmail } from "@/lib/db"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 })
    }

    const { email, password } = result.data

    // Check if user exists first
    const userExists = await findUserByEmail(email)
    if (!userExists) {
      console.log(`User not found: ${email}`)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Validate user credentials
    const user = await validateUser(email, password)
    if (!user) {
      console.log(`Invalid credentials for user: ${email}`)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = await createToken({
      id: user.id,
      email: user.email,
      userType: user.userType,
    })

    // Set cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "strict",
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
