import { api } from '@/lib/api'

export interface CheckoutSettings {
  pixels: {
    facebook?: string
    google?: string
    tiktok?: string
  }
  config: {
    collectPhone: boolean
    collectAddress: boolean
    onePageCheckout: boolean
  }
  dataSourceId?: string
  dataSource?: {
    id: string
    name: string
  }
}

export const getCheckoutSettings = async (serviceId: string): Promise<CheckoutSettings> => {
  const response = await api.get(`/services/${serviceId}/checkout/settings`)
  return response.data
}

export const updateCheckoutSettings = async (serviceId: string, settings: CheckoutSettings): Promise<CheckoutSettings> => {
  const response = await api.put(`/services/${serviceId}/checkout/settings`, settings)
  return response.data
}
