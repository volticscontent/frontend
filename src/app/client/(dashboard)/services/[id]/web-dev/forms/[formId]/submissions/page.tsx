"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFormById, getFormSubmissions, FormSubmission } from '@/services/forms';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FormSchema } from '@/types/form-builder';

export default function FormSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  // id is service id, formId is the form id
  const formId = params.formId as string;

  const { data: form, isLoading: isFormLoading } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => getFormById(formId),
    enabled: !!formId,
  });

  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: () => getFormSubmissions(formId),
    enabled: !!formId,
  });

  const isLoading = isFormLoading || isSubmissionsLoading;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!form) {
    return <div className="p-8">Formulário não encontrado.</div>;
  }

  const schema = form.schema as FormSchema;
  const fields = schema.fields || [];

  const handleExport = () => {
    if (!submissions || submissions.length === 0) return;

    // Create CSV content
    const headers = ['Data', ...fields.map(f => f.label)];
    const csvContent = [
      headers.join(','),
      submissions.map((sub: FormSubmission) => {
        const date = format(new Date(sub.createdAt), 'dd/MM/yyyy HH:mm');
        const values = fields.map(field => {
          const val = sub.data[field.id];
          // Handle potential commas in content by wrapping in quotes and escaping inner quotes
          const escapedVal = val !== undefined && val !== null ? String(val).replace(/"/g, '""') : '';
          return `"${escapedVal}"`;
        });
        return [`"${date}"`, ...values].join(',');
      }).join('\n')
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.title}_respostas.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
            <p className="text-muted-foreground">
              Respostas recebidas
            </p>
          </div>
        </div>
        <Button onClick={handleExport} disabled={!submissions?.length} variant="outline" className="gap-2">
          <Download size={16} />
          Exportar CSV
        </Button>
      </div>

      {!submissions || submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Nenhuma resposta ainda</h3>
          <p className="text-gray-500 max-w-sm text-center mt-2">
            Compartilhe o link do seu formulário para começar a receber respostas.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Data</th>
                  {fields.map(field => (
                    <th key={field.id} className="px-6 py-4 font-medium whitespace-nowrap">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub: FormSubmission) => (
                  <tr key={sub.id} className="bg-white border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(sub.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
                    </td>
                    {fields.map(field => (
                      <td key={field.id} className="px-6 py-4 text-gray-900 max-w-xs truncate" title={String(sub.data[field.id])}>
                        {String(sub.data[field.id] !== undefined ? sub.data[field.id] : '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
