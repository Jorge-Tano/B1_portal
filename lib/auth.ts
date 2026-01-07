// lib/auth.ts
import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LdapClient } from "@/lib/ldap-client";
import { UserSyncService, SyncResult } from "@/lib/user-sync";

const ALLOWED_OUS = process.env.ALLOWED_OUS
  ? process.env.ALLOWED_OUS.split(',').map(ou => ou.trim().toLowerCase()).filter(ou => ou.length > 0)
  : ['colombia'];

const BLOCKED_OUS = process.env.BLOCKED_OUS
  ? process.env.BLOCKED_OUS.split(',').map(ou => ou.trim().toLowerCase()).filter(ou => ou.length > 0)
  : [];

function extractOUFromDN(dn: string): string | null {
  if (!dn) return null;

  try {
    const parts = dn.split(',').map(part => part.trim());

    for (const part of parts) {
      if (part.toUpperCase().startsWith('OU=')) {
        return part.substring(3);
      }
    }

    return null;
  } catch {
    return null;
  }
}

function extractAllOUsFromDN(dn: string): string[] {
  if (!dn) return [];

  try {
    const ous: string[] = [];
    const parts = dn.split(',').map(part => part.trim());

    for (const part of parts) {
      if (part.toUpperCase().startsWith('OU=')) {
        ous.push(part.substring(3));
      }
    }

    return ous;
  } catch {
    return [];
  }
}

function validateUserOUAccess(userOU: string | null, userAllOUs: string[]): {
  allowed: boolean;
  message?: string;
} {
  if (!userOU) {
    return {
      allowed: false,
      message: 'No se pudo determinar la unidad organizativa'
    };
  }

  const userOULower = userOU.toLowerCase();
  const userAllOUsLower = userAllOUs.map(ou => ou.toLowerCase());

  if (ALLOWED_OUS.length === 0) {
    return {
      allowed: true,
      message: 'Sin restricciones de OU configuradas'
    };
  }

  const isBlocked = BLOCKED_OUS.some(blockedOU =>
    userAllOUsLower.includes(blockedOU) || userOULower === blockedOU
  );

  if (isBlocked) {
    return {
      allowed: false,
      message: `Acceso bloqueado. Usuario pertenece a una OU restringida`
    };
  }

  const isAllowed = ALLOWED_OUS.some(allowedOU =>
    userAllOUsLower.includes(allowedOU) || userOULower === allowedOU
  );

  if (isAllowed) {
    return {
      allowed: true,
      message: `Acceso permitido`
    };
  }

  return {
    allowed: false,
    message: `Acceso denegado. Usuario no pertenece a una OU permitida`
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Active Directory",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Por favor ingresa usuario y contraseña");
        }

        try {
          const ldapClient = new LdapClient();
          const username = credentials.username.trim();

          const authResult = await ldapClient.authenticateUser(username, credentials.password);

          if (!authResult.authenticated) {
            throw new Error(authResult.message || 'Credenciales incorrectas');
          }

          const userDataResult = await ldapClient.getUserDetails(username);

          if (!userDataResult.success || !userDataResult.data) {
            throw new Error(userDataResult.error || 'Error obteniendo datos del usuario');
          }

          const userData = userDataResult.data;

          const dn = userData.distinguishedName || '';
          const userOU = extractOUFromDN(dn);
          const userAllOUs = extractAllOUsFromDN(dn);

          const ouValidation = validateUserOUAccess(userOU, userAllOUs);

          if (!ouValidation.allowed) {
            throw new Error(ouValidation.message || 'Acceso denegado');
          }

          let syncResult: SyncResult = { success: false, message: 'No sincronizado' };

          try {
            syncResult = await UserSyncService.syncUserFromAD(userData);
          } catch {
          }

          const authUser = {
            id: userData.sAMAccountName || username,
            name: userData.displayName || username,
            email: userData.mail || undefined,
            employeeID: userData.employeeID || userData.sAMAccountName,
            ou: userOU || undefined,
            allOUs: userAllOUs,
            adUser: userData,
            syncData: syncResult.success ? {
              dbUserId: syncResult.user?.id,
              action: syncResult.action,
              timestamp: new Date().toISOString()
            } : undefined
          };

          return authUser;

        } catch (error: any) {
          throw new Error(error.message || 'Error de autenticación');
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      token.allOUs = token.allOUs || [];

      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.employeeID = (user as any).employeeID;
        token.ou = (user as any).ou;
        token.allOUs = (user as any).allOUs || [];
        token.adUser = (user as any).adUser;
        token.syncData = (user as any).syncData;

        if ((user as any).syncData?.dbUserId) {
          try {
            const dbUser = await UserSyncService.getUserById((user as any).syncData.dbUserId);
            token.dbUser = dbUser;
          } catch (error) {
            console.warn('Error al obtener usuario por ID:', error);
          }
        }
      }

      if (token.id && !token.dbUser) {
        try {
          const syncResult = await UserSyncService.verifyAndSyncUserSession(token.id);
          if (syncResult.success && syncResult.user) {
            token.dbUser = syncResult.user;
          }
        } catch (error) {
        }
      }

      if (trigger === "update" && session?.dbUser) {
        token.dbUser = session.dbUser;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.employeeID = token.employeeID as string;
        session.user.ou = token.ou as string;
        session.user.allOUs = token.allOUs as string[];
        session.user.adUser = token.adUser as any;
        session.user.syncData = token.syncData as any;
        session.user.dbUser = token.dbUser as any;
      }
      return session;
    }
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};