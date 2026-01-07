'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/ui/NavBar'
import { Header } from '@/components/ui/Header'
//Configuración General
import { CampaignsTable } from './components/General/CampaignsTable'
import { CampaignModal, DeleteModal } from './components/General/CampaignsModals'
import { UserModal } from './components/General/UserModal'
import { UsersTable } from './components/General/UsersTable'
//Configuración Anticipos
import { AmountsTable } from './components/Anticipos/AmountsTable'
import { AmountModal } from './components/Anticipos/AmountModal'
import { SimpleAutoBreadcrumb } from '@/components/ui/SimpleAutoBreadcrumb'
import {
  Campaign,
  UserRole,
  CampaignFormData,
  UserFormData,
  AmountConfig,
  AmountConfigFormData,
  Recipient,
  DocumentType,
  BankAccountType
} from '@/types/admin'
import { useAdminApi } from '@/hooks/useAdminApi'

type ConfigCategory = 'general' | 'anticipos'
type AdminSection = 'campañas' | 'usuarios' | 'montos' | 'destinatarios'

const configCategories = [
  {
    id: 'general' as ConfigCategory,
    name: 'General',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    sections: [
      { 
        id: 'usuarios' as AdminSection, 
        name: 'Usuarios', 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        ) 
      },
      { 
        id: 'campañas' as AdminSection, 
        name: 'Campañas', 
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ) 
      },
    ]
  },
  {
    id: 'anticipos' as ConfigCategory,
    name: 'Anticipos',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    sections: [
      { 
        id: 'montos' as AdminSection, 
        name: 'Montos', 
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ) 
      },
      { 
        id: 'destinatarios' as AdminSection, 
        name: 'Destinatarios', 
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ) 
      },
    ]
  }
]

export default function AdminPage() {
  const [isNavExpanded, setIsNavExpanded] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>('general')
  const [activeSection, setActiveSection] = useState<AdminSection>('usuarios')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3'

  const {
    campaigns,
    userRoles,
    documentTypes,
    bankAccountTypes,
    amountConfigs,
    loading,
    error,
    successMessage,
    fetchCampaigns,
    fetchUsers,
    fetchDocumentTypes,
    fetchBankAccountTypes,
    fetchAmountConfigs,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateUser,
    deleteUser,
    createAmountConfig,
    updateAmountConfig,
  } = useAdminApi()

  const [activeModal, setActiveModal] = useState<
    'createCampaign' | 'editCampaign' | 'editUser' | 'createAmount' | 'editAmount' | null
  >(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editingUser, setEditingUser] = useState<UserRole | null>(null)
  const [editingAmount, setEditingAmount] = useState<AmountConfig | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'campaign' | 'user'
    id: number
    name: string
  } | null>(null)

  const [campaignForm, setCampaignForm] = useState<CampaignFormData>({
    name: '',
    principal_id: ''
  })

  const [userForm, setUserForm] = useState<UserFormData>({
    role: 'ejecutivo',
    document_type: '',
    bank_account: '',
    bank_number: '',
  })

  const [amountForm, setAmountForm] = useState<AmountConfigFormData>({
    amount: '',
    description: ''
  })

  const recipients: Recipient[] = [
    { id: 1, name: "Carlos Rodríguez", email: "carlos.rodriguez@empresa.com", department: "Ventas" },
    { id: 2, name: "Laura Martínez", email: "laura.martinez@empresa.com", department: "Marketing" },
    { id: 3, name: "Roberto Sánchez", email: "roberto.sanchez@empresa.com", department: "Operaciones" },
    { id: 4, name: "Mónica Fernández", email: "monica.fernandez@empresa.com", department: "Finanzas" },
    { id: 5, name: "Pedro González", email: "pedro.gonzalez@empresa.com", department: "TI" },
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchCampaigns(),
          fetchUsers(),
          fetchDocumentTypes(),
          fetchBankAccountTypes(),
          fetchAmountConfigs()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const currentCategory = configCategories.find(cat => cat.id === activeCategory)
    if (currentCategory) {
      const firstSection = currentCategory.sections[0]
      if (firstSection) {
        handleSectionChange(firstSection.id)
      }
    }
  }, [activeCategory])

  const getSectionCount = (sectionId: AdminSection): number => {
    switch (sectionId) {
      case 'campañas': return campaigns.length
      case 'usuarios': return userRoles.length
      case 'montos': return amountConfigs.length
      case 'destinatarios': return recipients.length
      default: return 0
    }
  }

  const handleSectionChange = (sectionId: AdminSection) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveSection(sectionId)
      setTimeout(() => setIsTransitioning(false), 150)
    }, 150)
  }

  const handleCategoryChange = (categoryId: ConfigCategory) => {
    setIsTransitioning(true)
    setTimeout(() => setActiveCategory(categoryId), 150)
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCampaign(campaignForm)
      closeModal()
    } catch (error) {
      console.error('Error al crear campaña:', error)
    }
  }

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return
    try {
      await updateCampaign(editingCampaign.id, campaignForm)
      closeModal()
    } catch (error) {
      console.error('Error al actualizar campaña:', error)
    }
  }

  const handleDeleteCampaign = (campaign: Campaign) => {
    if (!campaign?.id) return
    setItemToDelete({
      type: 'campaign',
      id: campaign.id,
      name: campaign.name || 'Campaña sin nombre'
    })
    setDeleteModalOpen(true)
  }

  const handleUpdateUser = async (formData: UserFormData) => {
    if (!editingUser?.id) return
    try {
      const dataToSend = {
        ...formData,
        document_type: formData.document_type ? parseInt(formData.document_type) : null,
        bank_number: formData.bank_number ? parseInt(formData.bank_number) : null,
      }
      await updateUser(editingUser.id, dataToSend)
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error)
    }
  }

  const handleDeleteUser = (id: number) => {
    const user = userRoles.find(u => u.id === id)
    if (!user) return
    setItemToDelete({
      type: 'user',
      id,
      name: user.name?.trim() || 'Usuario sin nombre'
    })
    setDeleteModalOpen(true)
  }

  const handleCreateAmount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAmountConfig(amountForm)
      closeModal()
    } catch (error) {
      console.error('Error al crear monto:', error)
    }
  }

  const handleUpdateAmount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAmount) return
    try {
      await updateAmountConfig(editingAmount.id, amountForm)
      closeModal()
    } catch (error) {
      console.error('Error al actualizar monto:', error)
    }
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    try {
      if (itemToDelete.type === 'campaign') {
        await deleteCampaign(itemToDelete.id)
      } else {
        await deleteUser(itemToDelete.id)
      }
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (error: any) {
      console.error('Error al eliminar:', error)
    }
  }

  const openCreateCampaignModal = () => {
    setCampaignForm({ name: '', principal_id: '' })
    setEditingCampaign(null)
    setActiveModal('createCampaign')
  }

  const openEditCampaignModal = (campaign: Campaign) => {
    if (!campaign.id) return
    setEditingCampaign(campaign)
    setCampaignForm({
      name: campaign.name || '',
      principal_id: campaign.principal_id?.toString() || ''
    })
    setActiveModal('editCampaign')
  }

  const openCreateAmountModal = () => {
    setAmountForm({ amount: '', description: '' })
    setEditingAmount(null)
    setActiveModal('createAmount')
  }

  const openEditAmountModal = (amount: AmountConfig) => {
    if (!amount.id) return
    setEditingAmount(amount)
    setAmountForm({
      amount: amount.amount.toString(),
      description: amount.description || ''
    })
    setActiveModal('editAmount')
  }

  const openEditUserModal = (user: UserRole) => {
    if (!user.id) return
    setEditingUser(user)
    setUserForm({
      role: user.role || 'ejecutivo',
      document_type: user.document_type?.toString() || '',
      bank_account: user.bank_account || '',
      bank_number: user.bank_number?.toString() || '',
    })
    setActiveModal('editUser')
  }

  const closeModal = () => {
    setActiveModal(null)
    setEditingCampaign(null)
    setEditingUser(null)
    setEditingAmount(null)
    setCampaignForm({ name: '', principal_id: '' })
    setUserForm({ role: 'ejecutivo', document_type: '', bank_account: '', bank_number: '' })
    setAmountForm({ amount: '', description: '' })
  }

  const activeCategoryConfig = configCategories.find(cat => cat.id === activeCategory)
  const activeSections = activeCategoryConfig?.sections.map(section => ({
    ...section,
    count: getSectionCount(section.id)
  })) || []

  const sectionConfig = {
    'campañas': {
      title: 'Campañas',
      buttonText: '+ Nueva Campaña',
      buttonAction: openCreateCampaignModal
    },
    'usuarios': {
      title: 'Usuarios',
      buttonText: null,
      buttonAction: null
    },
    'montos': {
      title: 'Montos',
      buttonText: '+ Agregar Monto',
      buttonAction: openCreateAmountModal
    },
    'destinatarios': {
      title: 'Destinatarios',
      buttonText: null,
      buttonAction: null
    }
  }

  const currentSection = sectionConfig[activeSection]

  if (loading.campaigns || loading.users || loading.documentTypes || loading.bankAccountTypes || loading.amounts) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'administrador': 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
      'admin': 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
      'supervisor': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      'aprobador': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
      'revisor': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    }
    return colors[role.toLowerCase()] || 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      'ventas': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      'marketing': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
      'operaciones': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
      'finanzas': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
      'ti': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
    }
    return colors[department.toLowerCase()] || 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />

      <div className={`transition-all duration-300 ${contentPadding}`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        <div className="flex-1 p-4 pt-12">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">{successMessage}</span>
                </div>
              </div>
            )}

            {/* Header compacto */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Configuración
              </h1>
              <SimpleAutoBreadcrumb />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Administra las configuraciones del sistema
              </p>
            </div>

            {/* Categorías compactas */}
            <div className="flex gap-2 mb-6">
              {configCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                    ${activeCategory === category.id
                      ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                    }
                  `}
                >
                  <span className={activeCategory === category.id ? 'text-violet-600 dark:text-violet-400' : ''}>
                    {category.icon}
                  </span>
                  {category.name}
                </button>
              ))}
            </div>

            {/* Navegación por secciones */}
            <div className="mb-4">
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {activeSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all flex-1 justify-center
                      ${activeSection === section.id
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <span className={activeSection === section.id ? 'text-violet-600 dark:text-violet-400' : ''}>
                      {section.icon}
                    </span>
                    <span className="font-medium">{section.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({section.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido con animación */}
            <div className={`
              transition-all duration-300 ease-in-out
              ${isTransitioning 
                ? 'opacity-0 transform translate-x-4' 
                : 'opacity-100 transform translate-x-0'
              }
            `}>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                    {currentSection.title}
                  </h2>
                  {currentSection.buttonText && (
                    <button
                      onClick={currentSection.buttonAction}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                    >
                      {currentSection.buttonText}
                    </button>
                  )}
                </div>

                <div className="p-0.5">
                  {activeSection === 'campañas' && (
                    <CampaignsTable
                      campaigns={campaigns}
                      loading={loading.campaigns}
                      users={userRoles}
                      onEdit={openEditCampaignModal}
                      onDelete={handleDeleteCampaign}
                      onCreate={openCreateCampaignModal}
                      compact={true}
                    />
                  )}

                  {activeSection === 'usuarios' && (
                    <UsersTable
                      users={userRoles}
                      loading={loading.users}
                      onEdit={openEditUserModal}
                      onDelete={handleDeleteUser}
                      getRoleColor={getRoleColor}
                      bankAccountTypes={bankAccountTypes}
                      compact={true}
                    />
                  )}

                  {activeSection === 'montos' && (
                    <AmountsTable
                      amounts={amountConfigs}
                      loading={loading.amounts}
                      onEdit={openEditAmountModal}
                      onCreate={openCreateAmountModal}
                      compact={true}
                    />
                  )}

                  {activeSection === 'destinatarios' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Departamento
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Correo
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider w-20">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {recipients.map((recipient) => (
                            <tr key={recipient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-800 dark:text-gray-100">
                                  {recipient.name}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium ${getDepartmentColor(recipient.department)} rounded`}>
                                  {recipient.department}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-gray-600 dark:text-gray-400">
                                  {recipient.email}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
          users={userRoles}
          onClose={closeModal}
          onSubmit={activeModal === 'editCampaign' ? handleUpdateCampaign : handleCreateCampaign}
          onChange={setCampaignForm}
        />
      )}

      {activeModal === 'editUser' && editingUser && (
        <UserModal
          formData={userForm}
          documentTypes={documentTypes}
          bankAccountTypes={bankAccountTypes}
          editingUser={editingUser}
          onClose={closeModal}
          onSubmit={handleUpdateUser}
          onChange={setUserForm}
        />
      )}

      {(activeModal === 'createAmount' || activeModal === 'editAmount') && (
        <AmountModal
          isEdit={activeModal === 'editAmount'}
          formData={amountForm}
          editingAmount={editingAmount}
          onClose={closeModal}
          onSubmit={activeModal === 'editAmount' ? handleUpdateAmount : handleCreateAmount}
          onChange={setAmountForm}
        />
      )}

      {itemToDelete && (
        <DeleteModal
          isOpen={deleteModalOpen}
          itemName={itemToDelete.name || 'Elemento sin nombre'}
          onClose={() => {
            setDeleteModalOpen(false)
            setItemToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}