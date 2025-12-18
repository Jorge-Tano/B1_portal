import React from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  DollarSign,
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  ChevronRight,
  CreditCard,
  Wallet,
  BarChart3,
  Eye,
  Receipt
} from 'lucide-react';

const HistorialAnticipos = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Mis Anticipos
                </h1>
                <p className="text-gray-600 mt-2">
                  Historial completo de todos tus anticipos solicitados
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm w-full md:w-auto">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                MG
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">María González</h3>
                <p className="text-gray-600">Directora de Innovación</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                    Límite: $15,000
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por motivo, referencia o monto..."
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  disabled
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Filtrar por fecha</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Todos los estados</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all">
                <Download className="h-4 w-4" />
                <span className="font-medium">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-600">Total Solicitado</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">$28,450</h3>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">14 solicitudes en total</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl border border-green-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">Aprobados</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">$22,150</h3>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <span className="text-gray-600">11 aprobados</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl border border-yellow-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-yellow-600">Pendientes</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">$3,200</h3>
          <div className="text-sm text-gray-600">2 solicitudes en revisión</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 lg:col-span-3">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Anticipo
              </span>
            </div>
            <div className="col-span-3 lg:col-span-2">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Estado
              </span>
            </div>
            <div className="col-span-3 lg:col-span-2">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Fecha
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Monto
              </span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Acciones
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="px-6 py-5 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 lg:col-span-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-1">
                      Anticipo para viaje de trabajo
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>REF: ANT-2024-001</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">Viaje</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-3 lg:col-span-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 w-fit">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Pagado</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Completado</div>
              </div>
              
              <div className="col-span-3 lg:col-span-2">
                <div className="text-gray-900">
                  <div className="font-medium">15 Mar, 2024</div>
                  <div className="text-sm text-gray-500">Solicitado: 10 Mar</div>
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="font-bold text-lg text-gray-900">$3,500</div>
                <div className="text-sm text-gray-500">Viaje: Silicon Valley</div>
              </div>
              
              <div className="col-span-1">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          

          <div className="px-6 py-5 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 lg:col-span-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-100">
                    <Receipt className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-1">
                      Reembolso de gastos médicos
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>REF: ANT-2024-012</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">Salud</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-3 lg:col-span-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 w-fit">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Aprobado</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Por pagar</div>
              </div>
              
              <div className="col-span-3 lg:col-span-2">
                <div className="text-gray-900">
                  <div className="font-medium">22 Mar, 2024</div>
                  <div className="text-sm text-gray-500">Solicitado: 18 Mar</div>
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="font-bold text-lg text-gray-900">$850</div>
                <div className="text-sm text-gray-500">Consulta especializada</div>
              </div>
              
              <div className="col-span-1">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 lg:col-span-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-100">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-1">
                      Anticipo para evento corporativo
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>REF: ANT-2024-008</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">Evento</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-3 lg:col-span-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 w-fit">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Pendiente</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">En proceso</div>
              </div>
              
              <div className="col-span-3 lg:col-span-2">
                <div className="text-gray-900">
                  <div className="font-medium">10 Mar, 2024</div>
                  <div className="text-sm text-gray-500">Solicitado: 5 Mar</div>
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="font-bold text-lg text-gray-900">$2,000</div>
                <div className="text-sm text-gray-500">Conferencia anual</div>
              </div>
              
              <div className="col-span-1">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-gray-600">
          Mostrando <span className="font-semibold text-gray-900">3</span> de <span className="font-semibold text-gray-900">14</span> anticipos
        </div>
        
        <div className="flex items-center gap-2">
          <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
            Anterior
          </button>
          <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium">
            1
          </button>
          <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
            2
          </button>
          <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
            3
          </button>
          <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
            Siguiente
          </button>
        </div>
      </div>

      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-2">Información importante</h4>
            <p className="text-gray-700 mb-3">
              Este es tu historial personal de anticipos. Puedes ver el estado de cada solicitud, 
              descargar comprobantes y hacer seguimiento a los pagos pendientes.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Pagado/Aprobado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-600">En revisión</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Pendiente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorialAnticipos;