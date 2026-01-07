import { useState, useEffect } from 'react'
import { UserRole, UserFormData, DocumentType, BankAccountType } from '@/types/admin'

interface UserModalProps {
  formData: UserFormData
  documentTypes: DocumentType[]
  bankAccountTypes: BankAccountType[]
  editingUser: UserRole | null
  onClose: () => void
  onSubmit: (formData: UserFormData) => Promise<void>
  onChange: (data: UserFormData) => void
}

export function UserModal({
  formData,
  documentTypes,
  bankAccountTypes,
  editingUser,
  onClose,
  onSubmit,
  onChange
}: UserModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const ROLE_OPTIONS = [
    { value: 'ejecutivo', label: 'Ejecutivo' },
    { value: 'admin', label: 'Administrador' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'encargado', label: 'Encargado' },
    { value: 'tesoreria', label: 'Tesoreria' },
    { value: 'team_leader', label: 'Team Leader' },
  ] as const

  const handleInputChange = (field: keyof UserFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onChange({ 
      ...formData, 
      [field]: e.target.value 
    })
  }

  const handleClose = () => {
    if (isSubmitting) return
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      setIsSubmitting(false)
    }
  }

  if (!editingUser) return null

  const bankAccountName = bankAccountTypes.find(t => t.id === editingUser.bank_number)?.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      <div 
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 transition-all duration-300 max-h-[90vh] overflow-y-auto ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader 
          title="Editar Usuario" 
          onClose={handleClose} 
          disabled={isSubmitting}
        />

        <form onSubmit={handleSubmit} className="p-6">
          <UserInfoSection 
            user={editingUser} 
            bankAccountName={bankAccountName} 
          />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                CONFIGURACIÓN EDITABLE
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <SelectField
              label="Rol"
              value={formData.role || 'ejecutivo'}
              onChange={handleInputChange('role')}
              options={ROLE_OPTIONS}
              disabled={isSubmitting}
            />

            <SelectField
              label="Tipo de Documento"
              value={formData.document_type || ''}
              onChange={handleInputChange('document_type')}
              options={[
                { value: '', label: 'Seleccionar tipo de documento' },
                ...documentTypes.map(docType => ({
                  value: docType.id.toString(),
                  label: docType.name
                }))
              ]}
              disabled={isSubmitting}
            />

            <InputField
              label="Número de Cuenta Bancaria"
              value={formData.bank_account || ''}
              onChange={handleInputChange('bank_account')}
              placeholder="Ej: 1234567890"
              disabled={isSubmitting}
              helperText="Número completo de la cuenta bancaria"
            />

            <SelectField
              label="Tipo de Cuenta Bancaria"
              value={formData.bank_number || ''}
              onChange={handleInputChange('bank_number')}
              options={[
                { value: '', label: 'Seleccionar tipo de cuenta' },
                ...bankAccountTypes.map(bankType => ({
                  value: bankType.id.toString(),
                  label: `${bankType.name} (${bankType.code})`
                }))
              ]}
              disabled={isSubmitting}
              helperText="Seleccione el tipo de cuenta bancaria"
            />
          </div>

          <ModalFooter
            onClose={handleClose}
            isSubmitting={isSubmitting}
            submitText={isSubmitting ? 'Actualizando...' : 'Actualizar'}
          />
        </form>
      </div>
    </div>
  )
}

// Componentes auxiliares
const ModalHeader = ({ 
  title, 
  onClose, 
  disabled = false 
}: { 
  title: string; 
  onClose: () => void;
  disabled?: boolean;
}) => (
  <div className="sticky top-0 z-10 px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
      <button
        onClick={onClose}
        disabled={disabled}
        className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                  transition-colors duration-200 p-1 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <CloseIcon />
      </button>
    </div>
  </div>
)

const UserInfoSection = ({ 
  user, 
  bankAccountName 
}: { 
  user: UserRole; 
  bankAccountName?: string;
}) => (
  <div className="mb-6">
    <div className="text-center mb-2">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-2">
        <UserIcon />
      </div>
      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {user.name || 'Usuario sin nombre'}
      </h4>
    </div>
    <div className="text-center space-y-1">
      <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
        ID: {user.employeeid || 'Sin ID'}
      </p>
      {user.email && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {user.email}
        </p>
      )}
      
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {user.ou && (
          <InfoItem icon="ou">
            {user.ou}
          </InfoItem>
        )}
        
        {user.bank_account && (
          <InfoItem icon="account">
            # {user.bank_account}
          </InfoItem>
        )}
        
        {user.bank_number && (
          <InfoItem icon="type">
            {bankAccountName || `Tipo: ${user.bank_number}`}
          </InfoItem>
        )}
        
        {(user.telephone || user.mobile) && (
          <InfoItem icon="phone">
            {user.telephone || user.mobile}
          </InfoItem>
        )}
      </div>
    </div>
  </div>
)

const InfoItem = ({ 
  icon, 
  children 
}: { 
  icon: 'ou' | 'account' | 'type' | 'phone';
  children: React.ReactNode;
}) => {
  const IconComponent = {
    ou: OUIcon,
    account: AccountIcon,
    type: TypeIcon,
    phone: PhoneIcon
  }[icon]

  return (
    <div className="flex items-center gap-1 text-xs">
      <IconComponent />
      <span className="text-gray-600 dark:text-gray-400">
        {children}
      </span>
    </div>
  )
}

const SelectField = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  helperText
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
  helperText?: string
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                transition-colors duration-200"
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {helperText && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {helperText}
      </p>
    )}
  </div>
)

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  helperText
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  disabled?: boolean
  helperText?: string
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                transition-colors duration-200"
      placeholder={placeholder}
      disabled={disabled}
    />
    {helperText && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {helperText}
      </p>
    )}
  </div>
)

const ModalFooter = ({
  onClose,
  isSubmitting,
  submitText
}: {
  onClose: () => void
  isSubmitting: boolean
  submitText: string
}) => (
  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
    <button
      type="button"
      onClick={onClose}
      disabled={isSubmitting}
      className={`px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg 
                transition-colors duration-200 ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      Cancelar
    </button>
    <button
      type="submit"
      disabled={isSubmitting}
      className={`px-4 py-2 text-sm font-medium text-white 
                bg-violet-600 hover:bg-violet-700 rounded-lg 
                transition-all duration-200 hover:shadow-lg
                ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}
    >
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <Spinner />
          {submitText}
        </span>
      ) : submitText}
    </button>
  </div>
)

// Iconos
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const OUIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const AccountIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const TypeIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)