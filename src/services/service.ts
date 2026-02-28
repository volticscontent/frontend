import { api } from "@/lib/api"

export interface ServiceModule {
    id: string
    key: string
    name: string
    description?: string
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
}

export interface Service {
    id: string
    title: string
    description?: string
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
    sector?: string
    features: string[]
    modules: ServiceModule[]
    createdAt: string
    updatedAt: string
}

export const getServices = async (clientSlug: string): Promise<Service[]> => {
    const response = await api.get(`/${clientSlug}/services`)
    return response.data
}
