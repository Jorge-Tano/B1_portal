'use server'

// Importa la función del componente
import { signOutFunction } from "@/components/SignOutButton"

export async function signOutAction() {
  await signOutFunction("/login")
}