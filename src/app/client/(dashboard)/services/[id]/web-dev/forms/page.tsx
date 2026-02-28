"use client";

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getForms, deleteForm } from '@/services/forms';
import { Button } from '@/components/ui/button';
import { Plus, FileText, BarChart2, ExternalLink, Trash2, Edit, Copy, Check } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';

export default function FormsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const { data: forms, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: getForms,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success("Formulário excluído com sucesso");
    },
    onError: () => {
      toast.error("Erro ao excluir formulário");
    }
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPublicLink = (formId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/f/${formId}`;
  };

  const handleCreateForm = () => {
    // Navigate to builder with 'create' mode
    // We can pass a query param ?mode=create
    router.push(`/client/services/${params.id}/web-dev/forms/builder?mode=create`);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formulários</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus formulários de captura e pesquisa.
          </p>
        </div>
        <Button onClick={handleCreateForm} className="gap-2 bg-black text-white hover:bg-gray-800">
          <Plus size={16} />
          Novo Formulário
        </Button>
      </div>

      {!forms || forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Nenhum formulário criado</h3>
          <p className="text-gray-500 max-w-sm text-center mt-2 mb-8">
            Crie seu primeiro formulário para começar a coletar dados de seus visitantes.
          </p>
          <Button onClick={handleCreateForm} variant="outline" className="gap-2">
            <Plus size={16} />
            Criar Formulário
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div 
              key={form.id} 
              className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/client/services/${params.id}/web-dev/forms/builder?id=${form.id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/client/services/${params.id}/web-dev/forms/preview?id=${form.id}`)}>
                         <ExternalLink className="mr-2 h-4 w-4" />
                         Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => deleteMutation.mutate(form.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1" title={form.title}>
                  {form.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">
                  {form.description || "Sem descrição"}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>
                    {format(new Date(form.createdAt), "d 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                  {form._count && (
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
                      <BarChart2 size={12} />
                      {form._count.submissions || 0} respostas
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-white hover:bg-gray-50 text-xs font-medium h-9"
                    onClick={() => router.push(`/client/services/${params.id}/web-dev/forms/${form.id}/submissions`)}
                >
                    <BarChart2 size={14} className="mr-2" />
                    Respostas
                </Button>
                
                <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full bg-black text-white hover:bg-gray-800 text-xs font-medium h-9"
                    onClick={() => copyToClipboard(getPublicLink(form.id), form.id)}
                >
                    {copiedId === form.id ? (
                        <>
                            <Check size={14} className="mr-2" />
                            Copiado
                        </>
                    ) : (
                        <>
                            <Copy size={14} className="mr-2" />
                            Link Público
                        </>
                    )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
