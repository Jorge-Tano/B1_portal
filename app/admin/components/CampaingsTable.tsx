'use client'

import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { Campaign, UserRole } from '@/types/admin'

interface CampaignsTableProps {
  campaigns: Campaign[]
  users: UserRole[]
  loading: boolean
  onEdit: (campaign: Campaign) => void
  onDelete: (campaign: Campaign) => void
  onCreate: () => void
}

const getSupervisorName = (principalId: number | null, users: UserRole[]): string => {
  if (!principalId) return '—'
  const supervisor = users.find(user => user.id === principalId)
  return supervisor ? `${supervisor.name} (${supervisor.employeeid})` : `ID: ${principalId}`
}

export function CampaignsTable({
  campaigns,
  users,
  loading,
  onEdit,
  onDelete,
  onCreate
}: CampaignsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<Campaign>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="font-medium text-gray-800 dark:text-gray-100">
          {row.getValue('name')?.toString() || 'Sin nombre'}
        </div>
      )
    },
    {
      accessorKey: 'principal_id',
      header: 'Director',
      cell: ({ row }) => {
        const campaign = row.original
        return (
          <div className="text-gray-600 dark:text-gray-400">
            {getSupervisorName(campaign.principal_id, users)}
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <ActionsCell 
          campaign={row.original} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      ),
      enableSorting: false
    }
  ]

  const table = useReactTable({
    data: campaigns || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (loading) {
    return <LoadingState />
  }

  if (!campaigns || campaigns.length === 0) {
    return <EmptyState onCreate={onCreate} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {table.getRowModel().rows.map(row => (
            <tr 
              key={row.id} 
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Componentes auxiliares
const ActionsCell = ({ 
  campaign, 
  onEdit, 
  onDelete 
}: { 
  campaign: Campaign
  onEdit: (campaign: Campaign) => void
  onDelete: (campaign: Campaign) => void
}) => (
  <div className="flex items-center justify-end gap-1">
    <ActionButton
      onClick={() => onEdit(campaign)}
      icon="edit"
      title="Editar campaña"
    />
    <ActionButton
      onClick={() => onDelete(campaign)}
      icon="trash"
      title="Eliminar campaña"
      color="red"
    />
  </div>
)

const ActionButton = ({ 
  onClick, 
  icon, 
  title, 
  color = 'gray' 
}: { 
  onClick: () => void
  icon: 'edit' | 'trash'
  title: string
  color?: 'gray' | 'red'
}) => {
  const isRed = color === 'red'
  const baseClasses = 'p-1.5 rounded transition-colors'
  const colorClasses = isRed
    ? 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${colorClasses}`}
      title={title}
      type="button"
    >
      {icon === 'edit' ? <EditIcon /> : <TrashIcon />}
    </button>
  )
}

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Cargando campañas...</p>
    </div>
  </div>
)

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="text-center py-12">
    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
      <CampaignIcon />
    </div>
    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
      No hay campañas
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Comienza creando tu primera campaña
    </p>
    <button
      onClick={onCreate}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
    >
      + Crear campaña
    </button>
  </div>
)

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const CampaignIcon = () => (
  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)