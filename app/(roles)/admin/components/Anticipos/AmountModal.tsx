'use client'

import { useState, useEffect } from 'react'
import { AmountConfig, AmountConfigFormData } from '@/types/admin'

interface AmountModalProps {
  isEdit: boolean
  formData: AmountConfigFormData
  editingAmount: AmountConfig | null
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onChange: (data: AmountConfigFormData) => void
}

export function AmountModal({
  isEdit,
  formData,
  editingAmount,
  onClose,
  onSubmit,
  onChange
}: AmountModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const MODAL_CONFIG = {
    title: isEdit ? 'Editar Monto' : 'Nuevo Monto',
    submitText: isEdit ? 'Actualizar' : 'Crear'
  } as const

  const handleAmountChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      onChange({ ...formData, amount: value })
    }
  }

  const handleDescriptionChange = (value: string) => {
    onChange({ ...formData, description: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const amountNum = parseInt(formData.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0')
      return
    }

    onSubmit(e)
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      <div 
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
        }`}
      >
        <ModalHeader 
          title={MODAL_CONFIG.title}
          onClose={handleClose}
        />

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <AmountInput
              value={formData.amount}
              onChange={handleAmountChange}
            />
            
            <DescriptionInput
              value={formData.description || ''}
              onChange={handleDescriptionChange}
            />
          </div>

          <ModalFooter
            onClose={handleClose}
            submitText={MODAL_CONFIG.submitText}
          />
        </form>
      </div>
    </div>
  )
}

// Componentes internos
const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                  transition-colors duration-200 p-1"
        aria-label="Cerrar"
      >
        <CloseIcon />
      </button>
    </div>
  </div>
)

const ModalFooter = ({ onClose, submitText }: { onClose: () => void; submitText: string }) => (
  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg 
                transition-colors duration-200"
    >
      Cancelar
    </button>
    <button
      type="submit"
      className="px-4 py-2 text-sm font-medium text-white 
                bg-violet-600 hover:bg-violet-700 rounded-lg 
                transition-all duration-200 hover:shadow-lg"
    >
      {submitText}
    </button>
  </div>
)

const AmountInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Monto *
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 dark:text-gray-400">$</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                  transition-all duration-200"
        placeholder="Ej: 50000"
        required
        autoFocus
        inputMode="numeric"
      />
    </div>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
      Ingresa el monto sin comas ni puntos
    </p>
  </div>
)

const DescriptionInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Descripción (opcional)
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                transition-all duration-200"
      placeholder="Ej: Anticipo estándar"
      maxLength={50}
    />
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
      Máximo 50 caracteres
    </p>
  </div>
)

const CloseIcon = () => (
  <svg 
    className="w-5 h-5" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M6 18L18 6M6 6l12 12" 
    />
  </svg>
)