"use client";

import React from 'react';
import { FormBuilderProvider, useFormBuilder } from '@/context/FormBuilderContext';
import { FormRenderer } from '@/components/form-builder/renderer/FormRenderer';

function PreviewContent() {
  const { schema } = useFormBuilder();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
         <FormRenderer schema={schema} />
      </div>
    </div>
  );
}

export default function FormPreviewPage() {
  return (
    <FormBuilderProvider>
      <PreviewContent />
    </FormBuilderProvider>
  );
}
