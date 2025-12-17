import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

// Tipo para datos AD extendidos
interface ADUser {
  displayName?: string;
  mail?: string;
  sAMAccountName?: string;
  title?: string;
  department?: string;
  company?: string;
  raw?: any;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }

  // Obtener datos AD de la sesión
  const adUser = (session.user as any)?.adUser as ADUser;
  
  // Información principal
  const fullName = adUser?.displayName || session.user?.name || 'No disponible';
  const email = adUser?.mail || session.user?.email || 'No disponible';
  const username = adUser?.sAMAccountName || session.user?.id || 'N/A';
  
  // Información adicional si está disponible
  const title = adUser?.title || 'No especificado';
  const department = adUser?.department || 'No especificado';
  const company = adUser?.company || '2call.cl';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#4279ED] to-[#c52f30] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">B1P</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Portal B1</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Bienvenido</p>
                <p className="font-semibold text-gray-900">{fullName}</p>
                <p className="text-xs text-gray-500">{title}</p>
              </div>
              
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Principal</h2>
          <p className="text-gray-600">
            Sesión activa: {username} • {department} • {company}
          </p>
        </div>

        {/* Tarjetas Informativas Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Tarjeta 1: Información Personal desde AD */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <span className="text-blue-600 font-bold">👤</span>
              </div>
              <h3 className="ml-4 text-lg font-semibold">Información Personal</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Nombre completo" value={fullName} />
              <InfoRow label="Correo electrónico" value={email} />
              <InfoRow label="Usuario de red" value={username} />
              <InfoRow label="Cargo/Posición" value={title} />
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Fuente: {adUser?.displayName ? 'Active Directory' : 'Sesión básica'}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Información Organizacional */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <span className="text-green-600 font-bold">🏢</span>
              </div>
              <h3 className="ml-4 text-lg font-semibold">Información Organizacional</h3>
            </div>
            <div className="space-y-3">
              <InfoRow label="Departamento" value={department} />
              <InfoRow label="Empresa" value={company} />
              <InfoRow label="Dominio" value="2call.cl" />
              <div className="p-3 bg-green-50 rounded-lg mt-4">
                <p className="text-sm text-green-700">
                  <span className="font-medium">Autenticación:</span> LDAP Direct Bind
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {adUser?.raw ? 'Datos extendidos obtenidos' : 'Datos básicos'}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Estado de Sesión */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <span className="text-purple-600 font-bold">🔐</span>
              </div>
              <h3 className="ml-4 text-lg font-semibold">Estado de Sesión</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="font-medium text-gray-900">Sesión activa</span>
              </div>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Token JWT:</span> Válido por 8 horas</p>
                <p><span className="font-medium">ID de sesión:</span> {session.user?.id?.substring(0, 10)}...</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">
                  Última actualización: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Diagnóstico */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🛠️ Panel de Diagnóstico</h3>
          
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Resumen de Datos Obtenidos:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DataStatus label="Nombre AD" value={!!adUser?.displayName} />
              <DataStatus label="Correo AD" value={!!adUser?.mail} />
              <DataStatus label="Departamento" value={!!adUser?.department} />
              <DataStatus label="Datos crudos" value={!!adUser?.raw} />
            </div>
          </div>

          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer list-none p-3 bg-gray-100 rounded-lg hover:bg-gray-200">
              <span className="font-medium">Ver datos técnicos completos</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </summary>
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Sesión NextAuth:</h5>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <pre className="text-xs text-gray-800 overflow-x-auto">
{JSON.stringify({
  id: session.user?.id,
  name: session.user?.name,
  email: session.user?.email
}, null, 2)}
                    </pre>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Datos AD (si disponibles):</h5>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <pre className="text-xs text-gray-800 overflow-x-auto">
{JSON.stringify(adUser || 'No hay datos AD disponibles', null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Guía de Solución de Problemas */}
        <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
          <h4 className="text-lg font-semibold text-yellow-900 mb-3">🔧 Si no ves datos de AD:</h4>
          <ol className="space-y-2 text-yellow-800 list-decimal pl-5">
            <li>Verifica que el servidor LDAP esté accesible</li>
            <li>Revisa la consola del servidor para mensajes LDAP</li>
            <li>El AD puede no permitir consultas anónimas (normal)</li>
            <li>Los datos básicos (usuario/email) deberían mostrarse igual</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

// Componentes auxiliares
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-600 text-sm">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function DataStatus({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm">{label}: {value ? '✓' : '✗'}</span>
    </div>
  );
}