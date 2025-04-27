"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function LogoutButton({ variant = "outline", size = "icon" }: LogoutButtonProps) {
  const { signOut } = useAuth()

  return (
    <Button variant={variant} size={size} onClick={signOut}>
      <LogOut className="h-5 w-5" />
      <span className="sr-only">Sair</span>
    </Button>
  )
}
