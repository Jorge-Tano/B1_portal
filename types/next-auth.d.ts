import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      adUser?: ADUser;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    adUser?: ADUser;
  }
}

export interface ADUser {
  // Datos básicos del usuario
  dn?: string;
  sAMAccountName: string;
  displayName: string;
  mail: string;
  department?: string;
  title?: string;
  company?: string;
  physicalDeliveryOfficeName?: string;
  telephoneNumber?: string;
  mobile?: string;
  memberOf?: string[];
  userAccountControl?: number;
  isAccountEnabled?: boolean;
  groupAnalysis?: {
    isAdmin: boolean;
    totalGroups: number;
  };
  
  // Metadatos sobre la fuente de los datos (NUEVO)
  _metadata?: {
    source: string;
    hasFullData: boolean;
    readSuccess: boolean;
    timestamp?: string;
    methodUsed?: string;
  };
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    adUser?: ADUser;
  }
}