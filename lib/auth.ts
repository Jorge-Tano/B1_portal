import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateWithServiceAccount } from "./ldap-direct-bind";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Active Directory",
      credentials: {
        username: { label: "Usuario", type: "text", placeholder: "jperez" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            throw new Error("Por favor ingrese usuario y contraseña");
          }

          const username = credentials.username.trim().toLowerCase();
          
          // Usar la NUEVA función con cuenta de servicio
          const user = await authenticateWithServiceAccount(username, credentials.password);
          
          if (!user) {
            throw new Error("Usuario o contraseña incorrectos");
          }
          
          // Devolver datos COMPLETOS del AD
          return {
            id: user.sAMAccountName,
            name: user.displayName,
            email: user.mail,
            adUser: {
              ...user,
              // Para fácil acceso en el dashboard
              organization: {
                department: user.department,
                title: user.title,
                company: user.company
              }
            }
          };
          
        } catch (error: any) {
          console.error("[NextAuth] Error en authorize:", error);
          
          if (error.message.includes("conectar")) {
            throw new Error("No se puede conectar al servidor AD. Verifica la configuración.");
          }
          
          throw error;
        }
      }
    })
  ],
  
  // ... resto de la configuración igual
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.adUser = (user as any).adUser;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        (session.user as any).adUser = token.adUser;
      }
      return session;
    }
  },
  
  pages: {
    signIn: "/auth/login",
    error: "/auth/error"
  },
  
  debug: process.env.NODE_ENV === "development"
};