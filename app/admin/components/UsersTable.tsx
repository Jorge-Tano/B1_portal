'use client'

import { UserRole, BankAccountType } from '@/types/admin'

interface UsersTableProps {
  users: UserRole[]
  loading: boolean
  onEdit: (user: UserRole) => void
  onDelete: (id: number) => void
  getRoleColor: (role: string) => string
  bankAccountTypes?: BankAccountType[]
}

export function UsersTable({ 
  users, 
  loading, 
  onEdit, 
  onDelete, 
  getRoleColor,
  bankAccountTypes = []
}: UsersTableProps) {
  const getBankTypeName = (bankNumber: number | null): string => {
    if (!bankNumber) return '—'
    const bankType = bankAccountTypes.find(type => type.id === bankNumber)
    return bankType ? bankType.name : `ID: ${bankNumber}`
  }

  if (loading) {
    return <LoadingState />
  }

  if (users.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <TableHeader>Usuario</TableHeader>
            <TableHeader>Rol</TableHeader>
            <TableHeader>Cuenta Bancaria</TableHeader>
            <TableHeader className="w-28">Acciones</TableHeader>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              getRoleColor={getRoleColor}
              getBankTypeName={() => getBankTypeName(user.bank_number)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Componentes auxiliares
const LoadingState = () => (
  <div className="p-8 text-center">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
    <p className="mt-2 text-sm text-gray-500">Cargando usuarios...</p>
  </div>
)

const EmptyState = () => (
  <div className="p-8 text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
      <UsersIcon />
    </div>
    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No hay usuarios registrados</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
      Comienza agregando usuarios a la plataforma
    </p>
  </div>
)

const TableHeader = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string 
}) => (
  <th className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider ${className}`}>
    {children}
  </th>
)

const UserRow = ({ 
  user, 
  getRoleColor, 
  getBankTypeName, 
  onEdit, 
  onDelete 
}: { 
  user: UserRole
  getRoleColor: (role: string) => string
  getBankTypeName: () => string
  onEdit: (user: UserRole) => void
  onDelete: (id: number) => void
}) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
    <td className="px-4 py-3">
      <UserInfo user={user} />
    </td>
    
    <td className="px-4 py-3">
      <RoleBadge role={user.role} getRoleColor={getRoleColor} />
    </td>
    
    <td className="px-4 py-3">
      <BankAccountInfo 
        bankAccount={user.bank_account} 
        bankTypeName={getBankTypeName()}
      />
    </td>
    
    <td className="px-4 py-3">
      <ActionButtons 
        onEdit={() => onEdit(user)} 
        onDelete={() => onDelete(user.id)} 
      />
    </td>
  </tr>
)

const UserInfo = ({ user }: { user: UserRole }) => (
  <div className="min-w-0">
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <UserAvatar name={user.name} />
      </div>
      <div>
        <div className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate max-w-[200px]">
          {user.name || 'Sin nombre'}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
            ID: {user.employeeid || 'Sin ID'}
          </span>
          {user.email && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
              {user.email}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
)

const UserAvatar = ({ name }: { name?: string }) => (
  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
    <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
      {name?.charAt(0) || 'U'}
    </span>
  </div>
)

const RoleBadge = ({ 
  role, 
  getRoleColor 
}: { 
  role?: string; 
  getRoleColor: (role: string) => string 
}) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role || '')}`}>
    {(role || 'EJECUTIVO').toUpperCase()}
  </span>
)

const BankAccountInfo = ({ 
  bankAccount, 
  bankTypeName 
}: { 
  bankAccount?: string; 
  bankTypeName: string;
}) => (
  <div className="space-y-1">
    <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">
      {bankAccount || 'Sin cuenta'}
    </div>
    {bankTypeName !== '—' && (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {bankTypeName}
      </div>
    )}
  </div>
)

const ActionButtons = ({ 
  onEdit, 
  onDelete 
}: { 
  onEdit: () => void; 
  onDelete: () => void 
}) => (
  <div className="flex items-center gap-1">
    <ActionButton
      onClick={onEdit}
      icon="edit"
      title="Editar usuario"
      color="gray"
    />
    <ActionButton
      onClick={onDelete}
      icon="trash"
      title="Eliminar usuario"
      color="red"
    />
  </div>
)

const ActionButton = ({ 
  onClick, 
  icon, 
  title, 
  color 
}: { 
  onClick: () => void
  icon: 'edit' | 'trash'
  title: string
  color: 'gray' | 'red'
}) => {
  const colorClasses = color === 'red'
    ? 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'

  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${colorClasses}`}
      title={title}
    >
      {icon === 'edit' ? <EditIcon /> : <TrashIcon />}
    </button>
  )
}

// Iconos
const UsersIcon = () => (
  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)