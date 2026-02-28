// Utility import removed as slug is passed as argument
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getHeaders() {
  const token = localStorage.getItem('agency_client_token') || localStorage.getItem('agency_admin_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export interface CrmStats {
  contacts: {
    total: number
  }
  deals: {
    total: number
    won: number
    open: number
    totalValue: number
    wonValue: number
    pipelineValue: number
  }
}

export async function getCrmStats(slug: string): Promise<CrmStats> {
  const res = await fetch(`${API_URL}/api/${slug}/crm/stats`, {
    headers: getHeaders()
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch CRM stats')
  }
  
  return res.json()
}

export async function getContacts(slug: string) {
  const res = await fetch(`${API_URL}/api/${slug}/crm/contacts`, {
    headers: getHeaders()
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch contacts')
  }
  
  return res.json()
}

export async function getDeals(slug: string) {
  const res = await fetch(`${API_URL}/api/${slug}/crm/deals`, {
    headers: getHeaders()
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch deals')
  }
  
  return res.json()
}
