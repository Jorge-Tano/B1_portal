'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/ui/NavBar'
import { Header } from '@/components/ui/Header'
import { CampaignModal, DeleteModal } from '@/app/admin/components/CampaingsModals'
import { UserModal } from '@/app/admin/components/UserModal'
import { CampaignsTable } from '@/app/admin/components/CampaingsTable'
import { UsersTable } from '@/app/admin/components/UsersTable'
import { AmountsTable } from '@/app/admin/components/AmountsTable'
import { AmountModal } from '@/app/admin/components/AmountModal'
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

type AdminSection = 'campañas' | 'usuarios' | 'montos' | 'destinatarios'

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

export default function AdminPage() {
  const [isNavExpanded, setIsNavExpanded] = useState(false)
  const [activeSection, setActiveSection] = useState<AdminSection>('campañas')
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
  }, [fetchCampaigns, fetchUsers, fetchDocumentTypes, fetchBankAccountTypes, fetchAmountConfigs])

  // Handlers para campañas
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

  // Handler para actualizar usuario
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

  // Handler para eliminar usuario
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

  // Handlers para montos
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

  // Handler para confirmar eliminación
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

  // Handlers para abrir modales
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

  // Loading state
  if (loading.campaigns || loading.users || loading.documentTypes || loading.bankAccountTypes || loading.amounts) {
    return <LoadingScreen />
  }

  const sections = [
    { id: 'campañas' as AdminSection, name: 'Campañas', count: campaigns.length },
    { id: 'usuarios' as AdminSection, name: 'Usuarios', count: userRoles.length },
    { id: 'montos' as AdminSection, name: 'Montos', count: amountConfigs.length },
    { id: 'destinatarios' as AdminSection, name: 'Destinatarios', count: recipients.length },
  ]

  const sectionConfig = {
    'campañas': {
      title: 'Campañas',
      description: 'Configura las campañas disponibles en el sistema',
      buttonText: '+ Nueva Campaña',
      buttonAction: openCreateCampaignModal
    },
    'usuarios': {
      title: 'Usuarios',
      description: 'Gestión de usuarios y sus permisos',
      buttonText: null,
      buttonAction: null
    },
    'montos': {
      title: 'Montos Configurados',
      description: 'Valores fijos para anticipos',
      buttonText: '+ Agregar Monto',
      buttonAction: openCreateAmountModal
    },
    'destinatarios': {
      title: 'Destinatarios',
      description: 'Usuarios autorizados para recibir anticipos',
      buttonText: null,
      buttonAction: null
    }
  }

  const currentSection = sectionConfig[activeSection]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />

      <div className={`transition-all duration-400 ease-in-out ${contentPadding}`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        <div className="flex-1 p-6 pt-16">
          <div className="max-w-7xl mx-auto">
            {error && <ErrorMessage message={error} />}
            {successMessage && <SuccessMessage message={successMessage} />}

            <PageHeader />
            
            <NavigationTabs 
              sections={sections}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />

            <SectionContent 
              activeSection={activeSection}
              sectionConfig={currentSection}
              campaigns={campaigns}
              loading={loading}
              userRoles={userRoles}
              bankAccountTypes={bankAccountTypes}
              amountConfigs={amountConfigs}
              recipients={recipients}
              onEditCampaign={openEditCampaignModal}
              onDeleteCampaign={handleDeleteCampaign}
              onCreateCampaign={openCreateCampaignModal}
              onEditUser={openEditUserModal}
              onDeleteUser={handleDeleteUser}
              onCreateAmount={openCreateAmountModal}
              onEditAmount={openEditAmountModal}
              getRoleColor={getRoleColor}
              getDepartmentColor={getDepartmentColor}
            />
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

// Componentes auxiliares
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando configuración del sistema...</p>
    </div>
  </div>
)

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
    <div className="flex items-center gap-3">
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm text-red-700 dark:text-red-300">{message}</span>
    </div>
  </div>
)

const SuccessMessage = ({ message }: { message: string }) => (
  <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
    <div className="flex items-center gap-3">
      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm text-emerald-700 dark:text-emerald-300">{message}</span>
    </div>
  </div>
)

const PageHeader = () => (
  <div className="mb-8">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Administración del Sistema
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestión completa de configuraciones y usuarios
        </p>
      </div>
    </div>
  </div>
)

const NavigationTabs = ({
  sections,
  activeSection,
  onSectionChange
}: {
  sections: Array<{ id: AdminSection; name: string; count: number }>
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
}) => (
  <nav className="flex space-x-2 mb-8">
    {sections.map((section) => (
      <button
        key={section.id}
        onClick={() => onSectionChange(section.id)}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-w-[180px]
          ${activeSection === section.id
            ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
          }
        `}
      >
        <SectionIcon section={section.id} isActive={activeSection === section.id} />
        <div className="text-left">
          <div className="font-medium text-gray-800 dark:text-gray-100 text-sm">
            {section.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {section.count} registros
          </div>
        </div>
      </button>
    ))}
  </nav>
)

const SectionIcon = ({ section, isActive }: { section: AdminSection; isActive: boolean }) => {
  const iconClasses = `p-2 rounded-lg ${
    isActive 
      ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' 
      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
  }`

  const icons = {
    'campañas': <CampaignIcon />,
    'usuarios': <UserIcon />,
    'montos': <AmountIcon />,
    'destinatarios': <RecipientIcon />,
  }

  return <div className={iconClasses}>{icons[section]}</div>
}

const SectionContent = ({
  activeSection,
  sectionConfig,
  campaigns,
  loading,
  userRoles,
  bankAccountTypes,
  amountConfigs,
  recipients,
  onEditCampaign,
  onDeleteCampaign,
  onCreateCampaign,
  onEditUser,
  onDeleteUser,
  onCreateAmount,
  onEditAmount,
  getRoleColor,
  getDepartmentColor
}: {
  activeSection: AdminSection
  sectionConfig: any
  campaigns: Campaign[]
  loading: any
  userRoles: UserRole[]
  bankAccountTypes: BankAccountType[]
  amountConfigs: AmountConfig[]
  recipients: Recipient[]
  onEditCampaign: (campaign: Campaign) => void
  onDeleteCampaign: (campaign: Campaign) => void
  onCreateCampaign: () => void
  onEditUser: (user: UserRole) => void
  onDeleteUser: (id: number) => void
  onCreateAmount: () => void
  onEditAmount: (amount: AmountConfig) => void
  getRoleColor: (role: string) => string
  getDepartmentColor: (department: string) => string
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {sectionConfig.title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {sectionConfig.description}
        </p>
      </div>
      {sectionConfig.buttonText && (
        <button
          onClick={sectionConfig.buttonAction}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
        >
          {sectionConfig.buttonText}
        </button>
      )}
    </div>

    <div className="p-1">
      {activeSection === 'campañas' && (
        <CampaignsTable
          campaigns={campaigns}
          loading={loading.campaigns}
          users={userRoles}
          onEdit={onEditCampaign}
          onDelete={onDeleteCampaign}
          onCreate={onCreateCampaign}
        />
      )}

      {activeSection === 'usuarios' && (
        <UsersTable
          users={userRoles}
          loading={loading.users}
          onEdit={onEditUser}
          onDelete={onDeleteUser}
          getRoleColor={getRoleColor}
          bankAccountTypes={bankAccountTypes}
        />
      )}

      {activeSection === 'montos' && (
        <AmountsTable
          amounts={amountConfigs}
          loading={loading.amounts}
          onEdit={onEditAmount}
          onCreate={onCreateAmount}
        />
      )}

      {activeSection === 'destinatarios' && (
        <RecipientsTable 
          recipients={recipients} 
          getDepartmentColor={getDepartmentColor} 
        />
      )}
    </div>
  </div>
)

const RecipientsTable = ({ 
  recipients, 
  getDepartmentColor 
}: { 
  recipients: Recipient[]
  getDepartmentColor: (department: string) => string
}) => (
  <table className="w-full">
    <thead className="bg-gray-50 dark:bg-gray-900/50">
      <tr>
        <TableHeader>Nombre</TableHeader>
        <TableHeader>Departamento</TableHeader>
        <TableHeader>Correo</TableHeader>
        <TableHeader className="w-24">Acciones</TableHeader>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
      {recipients.map((recipient) => (
        <tr key={recipient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <td className="px-6 py-4">
            <div className="font-medium text-gray-800 dark:text-gray-100 text-sm">
              {recipient.name}
            </div>
          </td>
          <td className="px-6 py-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${getDepartmentColor(recipient.department)}`}>
              {recipient.department}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {recipient.email}
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <EditIcon />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <TrashIcon />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

const TableHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider ${className}`}>
    {children}
  </th>
)

// Iconos
const CampaignIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 5.197h-6m6 0V13c0-1.657-1.343-3-3-3m-6 0a3 3 0 00-3 3v8" />
  </svg>
)

const AmountIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const RecipientIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)