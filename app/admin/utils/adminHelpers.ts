export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const getRoleColor = (role: string) => {
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

export const getDepartmentColor = (department: string) => {
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