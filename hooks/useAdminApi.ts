import { useState, useCallback } from 'react'
import { Campaign, UserRole, CampaignFormData, UserFormData } from '@/types/admin'

export function useAdminApi() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState({
    campaigns: true,
    users: true
  })
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Función para mostrar mensajes temporales
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

  // Función para obtener campañas
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, campaigns: true }))
      
      // Usar ruta absoluta directamente
      const response = await fetch('/admin/api/campaings', {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {}
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setCampaigns(data)
    } catch (error: any) {
      console.error('Error en fetchCampaigns:', error)
      showMessage(error.message || 'Error al cargar las campañas', 'error')
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }))
    }
  }, [showMessage])

  // Función para obtener usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }))
      
      // Usar ruta absoluta directamente
      const response = await fetch('/admin/api/users', {
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {}
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setUserRoles(data)
    } catch (error: any) {
      console.error('Error en fetchUsers:', error)
      showMessage(error.message || 'Error al cargar los usuarios', 'error')
    } finally {
      setLoading(prev => ({ ...prev, users: false }))
    }
  }, [showMessage])

  // Función para crear una campaña
  const createCampaign = useCallback(async (formData: CampaignFormData) => {
    try {
      const response = await fetch('/admin/api/campaings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          principal_id: formData.principal_id ? parseInt(formData.principal_id) : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status} al crear campaña`)
      }

      const newCampaign = await response.json()
      setCampaigns(prev => [...prev, newCampaign])
      showMessage('Campaña creada exitosamente', 'success')
      return newCampaign
    } catch (error: any) {
      console.error('Error creating campaign:', error)
      showMessage(error.message || 'Error al crear la campaña', 'error')
      throw error
    }
  }, [showMessage])

  // Función para actualizar una campaña
  const updateCampaign = useCallback(async (id: number, formData: CampaignFormData) => {
    try {
      const response = await fetch(`/admin/api/campaings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          principal_id: formData.principal_id ? parseInt(formData.principal_id) : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status} al actualizar campaña`)
      }

      const updatedCampaign = await response.json()
      setCampaigns(prev =>
        prev.map(campaign => campaign.id === id ? updatedCampaign : campaign)
      )
      showMessage('Campaña actualizada exitosamente', 'success')
      return updatedCampaign
    } catch (error: any) {
      console.error('Error updating campaign:', error)
      showMessage(error.message || 'Error al actualizar la campaña', 'error')
      throw error
    }
  }, [showMessage])

  // Función para eliminar una campaña
  const deleteCampaign = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/admin/api/campaings/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status} al eliminar campaña`)
      }

      setCampaigns(prev => prev.filter(campaign => campaign.id !== id))
      showMessage('Campaña eliminada exitosamente', 'success')
    } catch (error: any) {
      console.error('Error deleting campaign:', error)
      showMessage(error.message || 'Error al eliminar la campaña', 'error')
      throw error
    }
  }, [showMessage])

  // Función para crear un usuario
  const createUser = useCallback(async (formData: UserFormData) => {
    try {
      const response = await fetch('/admin/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeid: formData.employeeid,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          campaign_id: formData.campaign_id ? parseInt(formData.campaign_id) : null,
          bank_account: formData.bank_account,
          document_type: formData.document_type ? parseInt(formData.document_type) : null,
          bank_number: formData.bank_number ? parseInt(formData.bank_number) : null,
          telephone: formData.telephone,
          mobile: formData.mobile,
          ou: formData.ou
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status} al crear usuario`)
      }

      const newUser = await response.json()
      setUserRoles(prev => [...prev, newUser])
      showMessage('Usuario creado exitosamente', 'success')
      return newUser
    } catch (error: any) {
      console.error('Error creating user:', error)
      showMessage(error.message || 'Error al crear el usuario', 'error')
      throw error
    }
  }, [showMessage])

  // Función para actualizar un usuario
  const updateUser = useCallback(async (id: number, formData: UserFormData) => {
    try {
      const response = await fetch(`/admin/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeid: formData.employeeid,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          campaign_id: formData.campaign_id ? parseInt(formData.campaign_id) : null,
          bank_account: formData.bank_account,
          document_type: formData.document_type ? parseInt(formData.document_type) : null,
          bank_number: formData.bank_number ? parseInt(formData.bank_number) : null,
          telephone: formData.telephone,
          mobile: formData.mobile,
          ou: formData.ou
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status} al actualizar usuario`)
      }

      const updatedUser = await response.json()
      setUserRoles(prev =>
        prev.map(user => user.id === id ? updatedUser : user)
      )
      showMessage('Usuario actualizado exitosamente', 'success')
      return updatedUser
    } catch (error: any) {
      console.error('Error updating user:', error)
      showMessage(error.message || 'Error al actualizar el usuario', 'error')
      throw error
    }
  }, [showMessage])

  // Función para eliminar un usuario
  const deleteUser = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/admin/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status} al eliminar usuario`)
      }

      setUserRoles(prev => prev.filter(user => user.id !== id))
      showMessage('Usuario eliminado exitosamente', 'success')
    } catch (error: any) {
      console.error('Error deleting user:', error)
      showMessage(error.message || 'Error al eliminar el usuario', 'error')
      throw error
    }
  }, [showMessage])

  return {
    campaigns,
    userRoles,
    loading,
    error,
    successMessage,
    showMessage,
    fetchCampaigns,
    fetchUsers,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    createUser,
    updateUser,
    deleteUser
  }
}