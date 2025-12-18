// app/actions.ts
'use server'

import { signOut } from "@/components/SignOutButton"

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}