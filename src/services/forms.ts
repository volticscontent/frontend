import { api } from '@/lib/api';
import { FormSchema, FormField } from '@/types/form-builder';

export type { FormSchema, FormField };

export interface Form {
  id: string;
  title: string;
  description?: string;
  redirectUrl?: string;
  schema: FormSchema;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    submissions: number;
  };
}

export interface CreateFormDTO {
  title: string;
  description?: string;
  redirectUrl?: string;
  schema: FormSchema;
  createDataSource?: boolean;
}

export type UpdateFormDTO = Partial<CreateFormDTO>;

export const getForms = async (): Promise<Form[]> => {
  // Note: clientSlug is used in the header or base URL in 'api' instance usually,
  // but if the route is global /api/forms, we rely on the token.
  // If the route was /api/:clientSlug/forms, we would use it.
  // Based on app.ts, it's /api/forms, which uses the authenticated user from token.
  const response = await api.get('/forms');
  return response.data;
};

export const getFormById = async (id: string): Promise<Form> => {
  const response = await api.get(`/forms/${id}`);
  return response.data;
};

export const getPublicFormById = async (id: string): Promise<Form> => {
  const response = await api.get(`/forms/${id}/public`);
  return response.data;
};

export const createForm = async (data: CreateFormDTO): Promise<Form> => {
  const response = await api.post('/forms', data);
  return response.data;
};

export const updateForm = async (id: string, data: UpdateFormDTO): Promise<Form> => {
  const response = await api.put(`/forms/${id}`, data);
  return response.data;
};

export const deleteForm = async (id: string): Promise<void> => {
  await api.delete(`/forms/${id}`);
};

export const submitForm = async (id: string, data: Record<string, unknown>): Promise<void> => {
  // Use a public endpoint or ensure this works without auth if needed
  await api.post(`/forms/${id}/submit`, data);
};

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export const getFormSubmissions = async (id: string, page = 1, limit = 50): Promise<FormSubmission[]> => {
  const response = await api.get(`/forms/${id}/submissions`, {
    params: { page, limit }
  });
  return response.data;
};
