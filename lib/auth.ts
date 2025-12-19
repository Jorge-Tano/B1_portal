// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LdapClient } from "@/lib/ldap-client";

// Para debug, verifica que la importación funciona
console.log('✅ LdapClient importado:', LdapClient ? 'SÍ' : 'NO');

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Active Directory",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        console.log('=== AUTENTICACIÓN AD ===');
        console.log('Usuario:', credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Por favor ingresa usuario y contraseña");
        }

        try {
          const ldapClient = new LdapClient();
          const username = credentials.username.trim().toLowerCase();
          
          // 1. Autenticar usuario (SIMPLIFICADO para testing)
          console.log('1. Autenticando...');
          const authResult = await ldapClient.authenticateUser(
            username,
            credentials.password
          );

          if (!authResult.authenticated) {
            throw new Error(authResult.message || 'Autenticación fallida');
          }

          console.log('✅ Autenticación exitosa');

          // 2. Obtener datos del usuario
          console.log('2. Obteniendo datos...');
          const userDataResult = await ldapClient.getUserDetails(username);
          
          console.log(`   Método: ${userDataResult.methodUsed}`);
          console.log(`   Éxito: ${userDataResult.success}`);
          
          if (userDataResult.error) {
            console.log(`   ⚠️ Advertencia: ${userDataResult.error}`);
          }

          // 3. Crear objeto de usuario
          const authUser = {
            id: userDataResult.data.sAMAccountName,
            name: userDataResult.data.displayName,
            email: userDataResult.data.mail,
            adUser: {
              ...userDataResult.data,
              _metadata: userDataResult.data._metadata
            }
          };

          console.log(`✅ Usuario creado: ${authUser.id}`);
          return authUser;

        } catch (error: any) {
          console.error('❌ Error en autorización:', error.message);
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
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.adUser = token.adUser as any;
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
  
  // Para debug
  debug: process.env.NODE_ENV === 'development',
};