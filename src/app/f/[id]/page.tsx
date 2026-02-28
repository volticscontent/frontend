"use client";

import { useQuery } from '@tanstack/react-query';
import { getPublicFormById } from '@/services/forms';
import { FormRenderer } from '@/components/form-builder/renderer/FormRenderer';
import { useParams } from 'next/navigation';

export default function PublicFormPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['public-form', id],
    queryFn: () => getPublicFormById(id),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-2 w-48 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
  }

  if (error || !form) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-md">
                <h1 className="text-xl font-bold text-gray-900 mb-2">Formulário não encontrado</h1>
                <p className="text-gray-500">O formulário que você está tentando acessar não existe ou foi removido.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden">
             {/* We pass formId specifically for submission */}
            <FormRenderer schema={form.schema} formId={form.id} />
        </div>
        <div className="mt-8 text-center text-xs text-gray-400">
            Powered by RDS
        </div>
    </div>
  );
}
