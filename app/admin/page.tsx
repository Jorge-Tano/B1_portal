'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/ui/NavBar'
import { Header } from '@/components/ui/Header'
import { CampaignModal } from '@/app/admin/components/CampaingsModals'
import { UserModal } from '@/app/admin/components/UserModal'
import { CampaignsTable } from '@/app/admin/components/CampaingsTable'
import { UsersTable } from '@/app/admin/components/UsersTable'
import {
  Campaign,
  UserRole,
  ModalType,
  CampaignFormData,
  UserFormData,
  AmountConfig,
  Recipient
} from '@/types/admin'
import { useAdminApi } from '@/hooks/useAdminApi'

// Helper functions directamente en el archivo
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'administrador':
    case 'admin':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
    case 'supervisor':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'aprobador':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'revisor':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'solicitante':
    case 'ejecutivo':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

const getDepartmentColor = (department: string) => {
  switch (department.toLowerCase()) {
    case 'ventas':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
    case 'marketing':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
    case 'operaciones':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
    case 'finanzas':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
    case 'ti':
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
    default:
      return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

export default function AdminPage() {
  const [isNavExpanded, setIsNavExpanded] = useState(false)
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3'

  // Estados usando hooks personalizados
  const {
    campaigns,
    userRoles,
    loading,
    error,
    successMessage,
    showMessage,
    fetchCampaigns,
    fetchUsers,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    createUser,
    updateUser,
    deleteUser
  } = useAdminApi()

  // Estados para modales
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editingUser, setEditingUser] = useState<UserRole | null>(null)

  // Estados para formularios
  const [campaignForm, setCampaignForm] = useState<CampaignFormData>({
    name: '',
    principal_id: ''
  })

  const [userForm, setUserForm] = useState<UserFormData>({
    employeeid: '',
    name: '',
    email: '',
    role: 'ejecutivo',
    campaign_id: '',
    bank_account: '',
    document_type: '1',
    bank_number: '',
    telephone: '',
    mobile: '',
    ou: ''
  })

  // Datos estáticos
  const [amountConfigs] = useState<AmountConfig[]>([
    { id: 1, amount: 50000 },
    { id: 2, amount: 10000 },
    { id: 3, amount: 30000 },
    { id: 4, amount: 100000 },
    { id: 5, amount: 500000 },
  ])

  const [recipients] = useState<Recipient[]>([
    { id: 1, name: "Carlos Rodríguez", email: "carlos.rodriguez@empresa.com", department: "Ventas" },
    { id: 2, name: "Laura Martínez", email: "laura.martinez@empresa.com", department: "Marketing" },
    { id: 3, name: "Roberto Sánchez", email: "roberto.sanchez@empresa.com", department: "Operaciones" },
    { id: 4, name: "Mónica Fernández", email: "monica.fernandez@empresa.com", department: "Finanzas" },
    { id: 5, name: "Pedro González", email: "pedro.gonzalez@empresa.com", department: "TI" },
  ])

  // Cargar datos al montar
  useEffect(() => {
    fetchCampaigns()
    fetchUsers()
  }, [])

  // Handlers para campañas
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCampaign(campaignForm)
    closeModal()
  }

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return
    await updateCampaign(editingCampaign.id, campaignForm)
    closeModal()
  }

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return
    await deleteCampaign(id)
  }

  // Handlers para usuarios
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    await createUser(userForm)
    closeModal()
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    await updateUser(editingUser.id, userForm)
    closeModal()
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return
    await deleteUser(id)
  }

  // Handlers para abrir modales
  const openCreateCampaignModal = () => {
    setCampaignForm({ name: '', principal_id: '' })
    setEditingCampaign(null)
    setActiveModal('createCampaign')
  }

  const openEditCampaignModal = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setCampaignForm({
      name: campaign.name,
      principal_id: campaign.principal_id?.toString() || ''
    })
    setActiveModal('editCampaign')
  }

  const openCreateUserModal = () => {
    setUserForm({
      employeeid: '',
      name: '',
      email: '',
      role: 'ejecutivo',
      campaign_id: '',
      bank_account: '',
      document_type: '1',
      bank_number: '',
      telephone: '',
      mobile: '',
      ou: ''
    })
    setEditingUser(null)
    setActiveModal('createUser')
  }

  const openEditUserModal = (user: UserRole) => {
    setEditingUser(user)
    setUserForm({
      employeeid: user.employeeid,
      name: user.name,
      email: user.email || '',
      role: user.role,
      campaign_id: user.campaign_id?.toString() || '',
      bank_account: user.bank_account || '',
      document_type: user.document_type?.toString() || '1',
      bank_number: user.bank_number?.toString() || '',
      telephone: user.telephone || '',
      mobile: user.mobile || '',
      ou: user.ou || ''
    })
    setActiveModal('editUser')
  }

  const closeModal = () => {
    setActiveModal(null)
    setEditingCampaign(null)
    setEditingUser(null)
    setCampaignForm({ name: '', principal_id: '' })
    setUserForm({
      employeeid: '',
      name: '',
      email: '',
      role: 'ejecutivo',
      campaign_id: '',
      bank_account: '',
      document_type: '1',
      bank_number: '',
      telephone: '',
      mobile: '',
      ou: ''
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />

      <div className={`transition-all duration-400 ease-in-out ${contentPadding}`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        <div className="flex-1 p-8 pt-20">
          <div className="max-w-7xl mx-auto">
            {/* Header de la página */}
            <div className="mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Panel de Administración
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Configura el sistema general y los módulos específicos
                  </p>
                </div>
              </div>
            </div>

            {/* Sección: Configuración General */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configuración General</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Configuraciones globales del sistema
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Campañas */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Campañas</h3>
                      <button
                        onClick={openCreateCampaignModal}
                        className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                      >
                        + Nueva
                      </button>
                    </div>
                  </div>
                  <div className="p-1">
                    <CampaignsTable
                      campaigns={campaigns}
                      loading={loading.campaigns}
                      onEdit={openEditCampaignModal}
                      onDelete={handleDeleteCampaign}
                      onCreate={openCreateCampaignModal}
                    />
                  </div>
                </div>

                {/* Usuarios */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Usuarios</h3>
                      <button
                        onClick={openCreateUserModal}
                        className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                      >
                        + Nuevo
                      </button>
                    </div>
                  </div>
                  <div className="p-1">
                    <UsersTable
                      users={userRoles}
                      loading={loading.users}
                      onEdit={openEditUserModal}
                      onDelete={handleDeleteUser}
                      onCreate={openCreateUserModal}
                      getRoleColor={getRoleColor}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Configuración de Anticipos */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configuración de Anticipos</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Configuraciones específicas del módulo de anticipos
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuración de Montos */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Montos Configurados</h3>
                      <button className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors">
                        + Agregar
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Cantidades fijas para anticipos
                    </p>
                  </div>
                  <div className="p-1">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-20">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {amountConfigs.map((config) => (
                          <tr key={config.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                                {formatCurrency(config.amount)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Destinatarios */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Destinatarios</h3>
                      <button className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors">
                        + Agregar
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Usuarios autorizados para recibir anticipos
                    </p>
                  </div>
                  <div className="p-1">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Depto.</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-20">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {recipients.map((recipient) => (
                          <tr key={recipient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">
                                  {recipient.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {recipient.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(recipient.department)}`}>
                                {recipient.department}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {(activeModal === 'createCampaign' || activeModal === 'editCampaign') && (
        <CampaignModal
          isEdit={activeModal === 'editCampaign'}
          formData={campaignForm}
          editingCampaign={editingCampaign}
          onClose={closeModal}
          onSubmit={activeModal === 'editCampaign' ? handleUpdateCampaign : handleCreateCampaign}
          onChange={setCampaignForm}
        />
      )}

      {(activeModal === 'createUser' || activeModal === 'editUser') && (
        <UserModal
          isEdit={activeModal === 'editUser'}
          formData={userForm}
          campaigns={campaigns}
          editingUser={editingUser}
          onClose={closeModal}
          onSubmit={activeModal === 'editUser' ? handleUpdateUser : handleCreateUser}
          onChange={setUserForm}
        />
      )}
    </div>
  )
}