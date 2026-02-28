"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getFormById } from '@/services/forms';
import { FormBuilderProvider } from '@/context/FormBuilderContext';
import { FormBuilder } from '@/components/form-builder/FormBuilder';

function BuilderContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { data: form, isLoading } = useQuery({
    queryKey: ['form', id],
    queryFn: () => getFormById(id as string),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
      <div className="text-gray-500">Carregando formulário...</div>
    </div>
  );

  return (
    <FormBuilder 
      mode={id ? 'edit' : 'create'} 
      initialData={form} 
    />
  );
}

export default function FormBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando...</div>}>
      <FormBuilderProvider>
        <BuilderContent />
      </FormBuilderProvider>
    </Suspense>
  );
}
