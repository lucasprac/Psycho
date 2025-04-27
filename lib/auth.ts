import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"

// Secret key for JWT
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
  return new TextEncoder().encode(secret)
}

export type User = {
  id: string
  name: string
  email: string
  userType: "psicologo" | "paciente"
}

export async function createToken(payload: Omit<User, "name">) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretKey())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey())
    return payload as User
  } catch (error) {
    return null
  }
}

export async function getUser(): Promise<User | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  return verifyToken(token)
}

export async function logout() {
  const cookieStore = cookies()
  cookieStore.delete("auth-token")
}
