// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LdapClient } from "@/lib/ldap-client";

// Cargar OUs permitidas desde variables de entorno
const ALLOWED_OUS = process.env.ALLOWED_OUS 
  ? process.env.ALLOWED_OUS.split(',').map(ou => ou.trim()).filter(ou => ou.length > 0)
  : [];

const BLOCKED_OUS = process.env.BLOCKED_OUS
  ? process.env.BLOCKED_OUS.split(',').map(ou => ou.trim()).filter(ou => ou.length > 0)
  : [];

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
          const username = credentials.username.trim().toLowerCase();
          
          // 1. Autenticar usuario
          const authResult = await ldapClient.authenticateUser(
            username,
            credentials.password
          );

          if (!authResult.authenticated) {
            throw new Error(authResult.message || 'Autenticación fallida');
          }

          // 2. Obtener datos completos del usuario (INCLUYENDO employeeID)
          const userDataResult = await ldapClient.getUserDetails(
            username, 
            [
              'sAMAccountName', 
              'displayName', 
              'mail', 
              'distinguishedName', 
              'memberOf',
              'employeeID',           // ← AÑADIDO
              'employeeNumber',       // ← AÑADIDO
              'title',                // ← AÑADIDO
              'department'            // ← AÑADIDO
            ]
          );
          
          if (!userDataResult.success) {
            throw new Error(userDataResult.error || 'Error obteniendo datos del usuario');
          }
          
          const userData = userDataResult.data;
          
          // 3. Validar OU del usuario
          const userOU = userData.ou;
          const userAllOUs = userData.allOUs || [];
          
          if (!userOU) {
            throw new Error('No se pudo determinar la unidad organizativa del usuario');
          }
          
          // 4. Validar si tiene acceso según OU
          const ouValidation = validateUserOUAccess(userOU, userAllOUs);
          
          if (!ouValidation.allowed) {
            throw new Error(ouValidation.message || 'Acceso denegado por configuración de OU');
          }
          
          // 5. Crear objeto de usuario con información de OU
          const authUser = {
          id: userData.sAMAccountName,
          name: userData.displayName,
          email: userData.mail,
          adUser: {
            ...userData,
            ou: userOU,
            allOUs: userAllOUs,
            // NUEVO: Incluir estructura de OU
            ouStructure: userData.ouStructure,
            isOUAllowed: ouValidation.allowed,
            _metadata: userData._metadata
          },
          ou: userOU,
          allOUs: userAllOUs,
          // NUEVO: Incluir estructura de OU directamente
          ouStructure: userData.ouStructure
        };

          return authUser;

        } catch (error: any) {
          console.error('Error en autenticación:', error.message);
          throw new Error(`Error de autenticación: ${error.message}`);
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.adUser = (user as any).adUser;
        token.ou = (user as any).ou;
        token.allOUs = (user as any).allOUs;
        // NUEVO: Pasar estructura de OU
        token.ouStructure = (user as any).ouStructure;
      }
      return token;
    },
    
     async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.adUser = token.adUser as any;
        session.user.ou = token.ou as string;
        session.user.allOUs = token.allOUs as string[];
        // NUEVO: Incluir estructura de OU en la sesión
        session.user.ouStructure = token.ouStructure as any;
      }
      return session;
    }
  },
  
  pages: {
    signIn: "/auth/login",
  },
  
  session: {
    strategy: "jwt",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  debug: process.env.NODE_ENV === 'development',
};

// Función de validación de OU
function validateUserOUAccess(userOU: string, userAllOUs: string[]): {
  allowed: boolean;
  message?: string;
} {
  // Si no hay OUs definidas, permitir todas
  if (ALLOWED_OUS.length === 0) {
    return { allowed: true, message: 'Sin restricciones de OU' };
  }
  
  // Verificar si está bloqueada
  const isBlocked = BLOCKED_OUS.some(blockedOU => 
    userAllOUs.some(userOUItem => 
      userOUItem.toLowerCase() === blockedOU.toLowerCase()
    ) || userOU.toLowerCase() === blockedOU.toLowerCase()
  );
  
  if (isBlocked) {
    return { 
      allowed: false, 
      message: `Usuario bloqueado. OU: ${userOU}` 
    };
  }
  
  // Verificar si está permitida
  const isAllowed = ALLOWED_OUS.some(allowedOU => 
    userAllOUs.some(userOUItem => 
      userOUItem.toLowerCase() === allowedOU.toLowerCase()
    ) || userOU.toLowerCase() === allowedOU.toLowerCase()
  );
  
  if (isAllowed) {
    return { 
      allowed: true, 
      message: `Usuario permitido. OU: ${userOU}` 
    };
  }
  
  return { 
    allowed: false, 
    message: `Acceso denegado. Usuario en OU "${userOU}". Permitidas: ${ALLOWED_OUS.join(', ')}` 
  };
}