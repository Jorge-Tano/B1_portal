import { UserRole } from '@/types/admin'

interface UsersTableProps {
  users: UserRole[]
  loading: boolean
  onEdit: (user: UserRole) => void
  onDelete: (id: number) => void
  onCreate: () => void
  getRoleColor: (role: string) => string
}

export function UsersTable({
  users,
  loading,
  onEdit,
  onDelete,
  onCreate,
  getRoleColor
}: UsersTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando usuarios...</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No hay usuarios registrados</p>
        <button
          onClick={onCreate}
          className="mt-2 px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
        >
          Crear primer usuario
        </button>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-900/50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Rol</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-24">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="px-4 py-3">
              <div className="text-sm text-gray-800 dark:text-gray-100">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.employeeid}
                  {user.email && ` • ${user.email}`}
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(user)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Editar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(user.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Eliminar"
                >
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
  )
}