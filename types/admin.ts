export interface DocumentType {
  id: number
  name: string
}

export interface BankAccountType {
  id: number
  code: string
  name: string
}

export interface UserRole {
  id: number
  employeeid: string
  name: string
  campaign_id: number | null
  bank_account: string | null
  role: string
  document_type: number | null
  bank_number: number | null
  email: string | null
  telephone: string | null
  mobile: string | null
  ou: string | null
}

export interface Campaign {
  id: number
  name: string
  principal_id: number | null
}

export interface AmountConfig {
  id: number
  amount: number
  created_at?: string
}

export interface Recipient {
  id: number
  name: string
  email: string
  department: string
}

export interface CampaignFormData {
  name: string
  principal_id: string
}

export interface UserFormData {
  employeeid: string
  name: string
  email: string
  role: string
  campaign_id: string
  bank_account: string
  document_type: string
  bank_number: string
  telephone: string
  mobile: string
  ou: string
}

export type ModalType = 'createCampaign' | 'editCampaign' | 'createUser' | 'editUser' | null