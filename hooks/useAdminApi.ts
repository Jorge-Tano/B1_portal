import { useState, useCallback } from 'react'
import {
  Campaign,
  UserRole,
  CampaignFormData,
  UserFormData,
  DocumentType,
  BankAccountType,
  AmountConfig,
  AmountConfigFormData
} from '@/types/admin'

export function useAdminApi() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [bankAccountTypes, setBankAccountTypes] = useState<BankAccountType[]>([])
  const [amountConfigs, setAmountConfigs] = useState<AmountConfig[]>([])
  const [loading, setLoading] = useState({
    campaigns: true,
    users: true,
    documentTypes: true,
    bankAccountTypes: true,
    amounts: true
  })
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const showMessage = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMessage(message)
      setError(null)
    } else {
      setError(message)
      setSuccessMessage(null)
    }

    setTimeout(() => {
      setSuccessMessage(null)
      setError(null)
    }, 5000)
  }, [])


  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, campaigns: true }))
      const response = await fetch('/admin/api/campaigns')

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()
      setCampaigns(data)
    } catch (error: any) {
      showMessage('Error al cargar las campañas', 'error')
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }))
    }
  }, [showMessage])

  const createCampaign = useCallback(async (formData: CampaignFormData) => {
    try {
      const response = await fetch('/admin/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          principal_id: formData.principal_id ? parseInt(formData.principal_id) : null
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const newCampaign = await response.json()
      setCampaigns(prev => [...prev, newCampaign])
      showMessage('Campaña creada exitosamente', 'success')
      return newCampaign
    } catch (error: any) {
      showMessage('Error al crear la campaña', 'error')
      throw error
    }
  }, [showMessage])

  const updateCampaign = useCallback(async (id: number, formData: CampaignFormData) => {
    try {
      const response = await fetch(`/admin/api/campaigns?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          principal_id: formData.principal_id ? parseInt(formData.principal_id) : null
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const updatedCampaign = await response.json()
      setCampaigns(prev =>
        prev.map(campaign =>
          campaign.id === id ? updatedCampaign : campaign
        )
      )
      showMessage('Campaña actualizada exitosamente', 'success')
      return updatedCampaign
    } catch (error: any) {
      showMessage('Error al actualizar la campaña', 'error')
      throw error
    }
  }, [showMessage])

  const deleteCampaign = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/admin/api/campaigns?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      setCampaigns(prev => prev.filter(campaign => campaign.id !== id))
      showMessage('Campaña eliminada exitosamente', 'success')
    } catch (error: any) {
      showMessage('Error al eliminar la campaña', 'error')
      throw error
    }
  }, [showMessage])


  const fetchUsers = useCallback(async (userId?: number) => {
    try {
      setLoading(prev => ({ ...prev, users: true }))
      const url = userId ? `/admin/api/users?id=${userId}` : '/admin/api/users'
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()

      if (userId) {
        return data
      }

      setUserRoles(data)
      return data
    } catch (error: any) {
      showMessage('Error al cargar los usuarios', 'error')
      throw error
    } finally {
      setLoading(prev => ({ ...prev, users: false }))
    }
  }, [showMessage])


  const fetchDocumentTypes = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, documentTypes: true }))
      const response = await fetch('/admin/api/document-types')

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()
      setDocumentTypes(data)
      return data
    } catch (error: any) {
      showMessage('Error al cargar tipos de documento', 'error')
      throw error
    } finally {
      setLoading(prev => ({ ...prev, documentTypes: false }))
    }
  }, [showMessage])

  const fetchBankAccountTypes = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, bankAccountTypes: true }))
      const response = await fetch('/admin/api/bank-account-types')

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()
      setBankAccountTypes(data)
      return data
    } catch (error: any) {
      showMessage('Error al cargar tipos de cuentas bancarias', 'error')
      throw error
    } finally {
      setLoading(prev => ({ ...prev, bankAccountTypes: false }))
    }
  }, [showMessage])

  const updateUser = useCallback(async (id: number, formData: Partial<UserFormData>) => {
    try {
      const requestBody = {
        employeeid: formData.employeeid ? String(formData.employeeid).trim() : undefined,
        name: formData.name ? String(formData.name).trim() : undefined,
        email: formData.email ? String(formData.email).trim() : null,
        role: formData.role,
        campaign_id: formData.campaign_id ? parseInt(String(formData.campaign_id)) : null,
        bank_account: formData.bank_account ? String(formData.bank_account).trim() : null,
        document_type: formData.document_type ? parseInt(String(formData.document_type)) : null,
        bank_number: formData.bank_number ? parseInt(String(formData.bank_number)) : null,
        telephone: formData.telephone ? String(formData.telephone).trim() : null,
        mobile: formData.mobile ? String(formData.mobile).trim() : null,
        ou: formData.ou ? String(formData.ou).trim() : null
      }

      const response = await fetch(`/admin/api/users?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const updatedUser = await response.json()
      setUserRoles(prev =>
        prev.map(user =>
          user.id === id ? { ...user, ...updatedUser } : user
        )
      )
      showMessage('Usuario actualizado exitosamente', 'success')
      return updatedUser
    } catch (error: any) {
      showMessage('Error al actualizar el usuario', 'error')
      throw error
    }
  }, [showMessage])

  const deleteUser = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/admin/api/users?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      setUserRoles(prev => prev.filter(user => user.id !== id))
      showMessage('Usuario eliminado exitosamente', 'success')
    } catch (error: any) {
      showMessage('Error al eliminar el usuario', 'error')
      throw error
    }
  }, [showMessage])

  const fetchAmountConfigs = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, amounts: true }))
      const response = await fetch('/admin/api/amount-configs')

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const data = await response.json()
      setAmountConfigs(data)
      return data
    } catch (error: any) {
      showMessage('Error al cargar montos configurados', 'error')
      throw error
    } finally {
      setLoading(prev => ({ ...prev, amounts: false }))
    }
  }, [showMessage])

  const createAmountConfig = useCallback(async (formData: AmountConfigFormData) => {
    try {
      const response = await fetch('/admin/api/amount-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(formData.amount),
          description: formData.description || null
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const newAmount = await response.json()
      setAmountConfigs(prev => [...prev, newAmount])
      showMessage('Monto creado exitosamente', 'success')
      return newAmount
    } catch (error: any) {
      showMessage('Error al crear el monto', 'error')
      throw error
    }
  }, [showMessage])

  const updateAmountConfig = useCallback(async (id: number, formData: AmountConfigFormData) => {
    try {
      const response = await fetch(`/admin/api/amount-configs?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(formData.amount),
          description: formData.description || null
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}`)
      }

      const updatedAmount = await response.json()
      setAmountConfigs(prev =>
        prev.map(amount =>
          amount.id === id ? updatedAmount : amount
        )
      )
      showMessage('Monto actualizado exitosamente', 'success')
      return updatedAmount
    } catch (error: any) {
      showMessage('Error al actualizar el monto', 'error')
      throw error
    }
  }, [showMessage])

  return {
    campaigns,
    userRoles,
    documentTypes,
    bankAccountTypes,
    amountConfigs,
    loading,
    error,
    successMessage,
    showMessage,
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
    updateAmountConfig
  }
}