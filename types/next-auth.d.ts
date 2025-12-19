// types/next-auth.d.ts
import { DefaultSession } from "next-auth";
import { EssentialADUser } from "@/lib/ldap-client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      adUser?: EssentialADUser; // Opcional
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    adUser?: EssentialADUser; // Opcional
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    adUser?: EssentialADUser; // Opcional
  }
}