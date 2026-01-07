import { useState, useEffect } from 'react'
import { Campaign, CampaignFormData } from '@/types/admin'

interface CampaignModalProps {
  isEdit: boolean
  formData: CampaignFormData
  editingCampaign: Campaign | null
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onChange: (data: CampaignFormData) => void
}

interface DeleteModalProps {
  isOpen: boolean
  itemName: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function CampaignModal({
  isEdit,
  formData,
  editingCampaign,
  onClose,
  onSubmit,
  onChange
}: CampaignModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const MODAL_CONFIG = {
    title: isEdit ? 'Editar Campaña' : 'Nueva Campaña',
    submitText: isEdit ? 'Actualizar' : 'Crear'
  } as const

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

        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-4">
            <FormField
              label="Nombre de la Campaña *"
              value={formData.name}
              onChange={(value) => onChange({ ...formData, name: value })}
              required={true}
              autoFocus={true}
            />

            <FormField
              label="ID Principal (opcional)"
              type="number"
              value={formData.principal_id}
              onChange={(value) => onChange({ ...formData, principal_id: value })}
              required={false}
              placeholder="Ej: 123"
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

export function DeleteModal({ isOpen, itemName, onClose, onConfirm }: DeleteModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  if (!isOpen && !isVisible) return null

  const displayName = itemName?.trim() || 'este elemento'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
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
          title="Confirmar Eliminación"
          onClose={handleClose}
          disabled={isLoading}
        />

        <div className="p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <WarningIcon />
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              ¿Estás seguro de eliminar?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Esta acción eliminará permanentemente "<span className="font-semibold text-gray-800 dark:text-gray-200">{displayName}</span>".
              <span className="block mt-1 font-medium text-red-600 dark:text-red-400">
                Esta acción no se puede deshacer.
              </span>
            </p>

            <DeleteActions
              onClose={handleClose}
              onConfirm={handleConfirm}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Componentes internos
const ModalHeader = ({ 
  title, 
  onClose, 
  disabled = false 
}: { 
  title: string; 
  onClose: () => void;
  disabled?: boolean;
}) => (
  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                  transition-colors duration-200 p-1"
        disabled={disabled}
      >
        <CloseIcon />
      </button>
    </div>
  </div>
)

const FormField = ({
  label,
  type = 'text',
  value,
  onChange,
  required,
  placeholder,
  autoFocus = false
}: {
  label: string
  type?: 'text' | 'number'
  value: string
  onChange: (value: string) => void
  required: boolean
  placeholder?: string
  autoFocus?: boolean
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                transition-all duration-200"
      required={required}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
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

const DeleteActions = ({
  onClose,
  onConfirm,
  isLoading
}: {
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}) => (
  <div className="flex justify-center gap-3">
    <button
      type="button"
      onClick={onClose}
      disabled={isLoading}
      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg 
                transition-colors duration-200 min-w-[100px]"
    >
      Cancelar
    </button>
    <button
      type="button"
      onClick={onConfirm}
      disabled={isLoading}
      className="px-4 py-2 text-sm font-medium text-white 
                bg-red-600 hover:bg-red-700 disabled:bg-red-400 
                rounded-lg transition-all duration-200 min-w-[100px]
                hover:shadow-lg disabled:cursor-not-allowed"
    >
      {isLoading ? <LoadingSpinner text="Eliminando..." /> : 'Eliminar'}
    </button>
  </div>
)

const LoadingSpinner = ({ text }: { text: string }) => (
  <span className="flex items-center justify-center">
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    {text}
  </span>
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

const WarningIcon = () => (
  <svg 
    className="h-6 w-6 text-red-600 dark:text-red-400" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.142 16.5c-.77.833.192 2.5 1.732 2.5z" 
    />
  </svg>
)