'use server'

import { signOutFunction } from "@/components/SignOutButton"

export async function signOutAction() {
  await signOutFunction("/login")
}