// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { ADUserData } from "@/lib/ldap-client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      adUser?: ADUserData;
      ou?: string;
      allOUs?: string[];
      employeeID?: string;
      // NUEVO: Estructura de OU
      ouStructure?: {
        colombia?: string;
        ti?: string;
        platform?: string;
        fullPath?: string[];
        isInTI?: boolean;
        isInColombia?: boolean;
      };
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    adUser?: ADUserData;
    ou?: string;
    allOUs?: string[];
    employeeID?: string;
    // NUEVO: Estructura de OU
    ouStructure?: {
      colombia?: string;
      ti?: string;
      platform?: string;
      fullPath?: string[];
      isInTI?: boolean;
      isInColombia?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    adUser?: ADUserData;
    ou?: string;
    allOUs?: string[];
    employeeID?: string;
    // NUEVO: Estructura de OU
    ouStructure?: {
      colombia?: string;
      ti?: string;
      platform?: string;
      fullPath?: string[];
      isInTI?: boolean;
      isInColombia?: boolean;
    };
  }
}