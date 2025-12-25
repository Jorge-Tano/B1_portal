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
      employeeID?: string;
      adUser?: ADUserData;
      ou?: string;
      allOUs?: string[];
      // Estructura de OU
      ouStructure?: {
        colombia?: string;
        ti?: string;
        platform?: string;
        fullPath?: string[];
        isInTI?: boolean;
        isInColombia?: boolean;
      };
      // Datos de sincronización
      syncData?: {
        dbUserId?: number;
        action?: 'created' | 'updated' | 'skipped';
        timestamp?: string;
      };
      // Datos de la base de datos
      dbUser?: {
        id: number;
        employeeID: string;
        name: string;
        campaign_id?: number;
        role?: string;
      };
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    employeeID?: string;
    adUser?: ADUserData;
    ou?: string;
    allOUs?: string[];
    // Estructura de OU
    ouStructure?: {
      colombia?: string;
      ti?: string;
      platform?: string;
      fullPath?: string[];
      isInTI?: boolean;
      isInColombia?: boolean;
    };
    // Datos de sincronización
    syncData?: {
      dbUserId?: number;
      action?: 'created' | 'updated' | 'skipped';
      timestamp?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    employeeID?: string;
    adUser?: ADUserData;
    ou?: string;
    allOUs?: string[];
    // Estructura de OU
    ouStructure?: {
      colombia?: string;
      ti?: string;
      platform?: string;
      fullPath?: string[];
      isInTI?: boolean;
      isInColombia?: boolean;
    };
    // Datos de sincronización
    syncData?: {
      dbUserId?: number;
      action?: 'created' | 'updated' | 'skipped';
      timestamp?: string;
    };
    // Datos de la base de datos
    dbUser?: {
      id: number;
      employeeID: string;
      name: string;
      campaign_id?: number;
      role?: string;
    };
  }
}