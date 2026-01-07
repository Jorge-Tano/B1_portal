'use client'

export const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    'administrador': 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
    'admin': 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
    'supervisor': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    'aprobador': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    'revisor': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  }
  return colors[role.toLowerCase()] || 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

export const getDepartmentColor = (department: string) => {
  const colors: Record<string, string> = {
    'ventas': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    'marketing': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    'operaciones': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    'finanzas': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    'ti': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  }
  return colors[department.toLowerCase()] || 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}