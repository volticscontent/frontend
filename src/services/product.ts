import { api } from '@/lib/api'

export interface Product {
  id: string
  name: string
  description?: string
  image?: string
  tags?: string[]
  price: number
  currency: string
  sku?: string
  active: boolean
  source?: string
  createdAt: string
  updatedAt: string
}

export const getProducts = async (slug: string) => {
  const response = await api.get(`/${slug}/products`)
  return response.data
}

export const createProduct = async (slug: string, data: Partial<Product>) => {
  const response = await api.post(`/${slug}/products`, data)
  return response.data
}

export const updateProduct = async (slug: string, id: string, data: Partial<Product>) => {
  const response = await api.put(`/${slug}/products/${id}`, data)
  return response.data
}

export const deleteProduct = async (slug: string, id: string) => {
  await api.delete(`/${slug}/products/${id}`)
}

export const syncCmsProductToStripe = async (slug: string, productId: string) => {
  console.log(`[syncCmsProductToStripe] Syncing product ${productId} for slug ${slug}`);
  const response = await api.post(`/${slug}/stripe/sync-cms-product`, { productId })
  return response.data
}
