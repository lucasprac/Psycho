// This is a simple in-memory database for demonstration purposes
// In a real application, you would use a proper database like PostgreSQL, MongoDB, etc.

import { hash, compare } from "bcrypt"

export type StoredUser = {
  id: string
  name: string
  email: string
  password: string
  userType: "psicologo" | "paciente"
  createdAt: Date
}

// In-memory storage for users
const users: StoredUser[] = []

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  return users.find((user) => user.email === email) || null
}

export async function createUser(name: string, email: string, password: string, userType: "psicologo" | "paciente") {
  // Check if user already exists
  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    throw new Error("User already exists")
  }

  // Hash password
  const hashedPassword = await hash(password, 10)

  // Create new user
  const newUser: StoredUser = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
    userType,
    createdAt: new Date(),
  }

  users.push(newUser)
  return newUser
}

export async function validateUser(email: string, password: string): Promise<Omit<StoredUser, "password"> | null> {
  // Find user
  const user = await findUserByEmail(email)
  if (!user) {
    console.log(`User not found: ${email}`)
    return null
  }

  // Verify password
  const passwordMatch = await compare(password, user.password)
  if (!passwordMatch) {
    console.log(`Password mismatch for user: ${email}`)
    return null
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function getAllUsers(): Promise<Omit<StoredUser, "password">[]> {
  return users.map(({ password, ...user }) => user)
}
