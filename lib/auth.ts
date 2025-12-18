import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { LdapClient } from "@/lib/ldap-client";

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

        const ldapClient = new LdapClient();
        const username = credentials.username.trim().toLowerCase();
        
        try {
          // 1. Autenticar usuario
          console.log('1. Autenticando...');
          const authResult = await ldapClient.authenticateUser(
            username,
            credentials.password
          );

          if (!authResult.authenticated) {
            throw new Error(authResult.message || 'Usuario o contraseña incorrectos');
          }

          console.log('✅ Autenticación exitosa');

          // 2. INTENTAR LEER DATOS (con múltiples métodos)
          console.log('2. Intentando leer datos del usuario...');
          const userDataResult = await ldapClient.getUserDetails(username);
          
          console.log(`   Método usado: ${userDataResult.methodUsed}`);
          
          if (userDataResult.error) {
            console.log(`   ⚠️ Advertencia: ${userDataResult.error}`);
          }

          // 3. Crear objeto de usuario con METADATOS sobre la fuente de datos
          const authUser = {
            id: userDataResult.data.sAMAccountName,
            name: userDataResult.data.displayName,
            email: userDataResult.data.mail,
            adUser: {
              ...userDataResult.data,
              _metadata: {
                source: userDataResult.methodUsed,
                hasFullData: userDataResult.methodUsed.includes('completo'),
                readSuccess: userDataResult.success,
                timestamp: new Date().toISOString()
              }
            }
          };

          console.log(`✅ Usuario creado: ${authUser.id} (${userDataResult.methodUsed})`);
          return authUser;

        } catch (error: any) {
          console.error('❌ Error en autorización:', error.message);
          throw error;
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
};