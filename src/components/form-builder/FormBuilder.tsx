"use client";

import React, { useState, useEffect } from 'react';
import { useFormBuilder } from '@/context/FormBuilderContext';
import { Toolbar } from './builder/Toolbar';
import { FieldEditor } from './builder/FieldEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Settings, Database, Eye, LayoutTemplate, Smartphone, Monitor } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { createForm, updateForm, Form } from '@/services/forms';
import { cn } from '@/lib/utils';

interface FormBuilderProps {
  initialData?: Form;
  mode: 'create' | 'edit';
}

export function FormBuilder({ initialData, mode }: FormBuilderProps) {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;
  const { schema, loadSchema, updateFormMetadata } = useFormBuilder();
  const [isSaving, setIsSaving] = useState(false);
  const [createDataSource, setCreateDataSource] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Initialize with data if in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      loadSchema(initialData.schema);
    }
  }, [mode, initialData, loadSchema]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (!schema.title) {
        toast.error("O formulário precisa de um título");
        setIsSaving(false);
        return;
      }

      if (schema.fields.length === 0) {
        toast.error("Adicione pelo menos um campo ao formulário");
        setIsSaving(false);
        return;
      }

      const formData = {
        title: schema.title,
        description: schema.description,
        redirectUrl: schema.redirectUrl,
        schema: schema,
        createDataSource: createDataSource
      };

      if (mode === 'create') {
        await createForm(formData);
        toast.success("Formulário criado com sucesso!");
      } else {
        if (!initialData?.id) return;
        await updateForm(initialData.id, formData);
        toast.success("Formulário atualizado com sucesso!");
      }

      if (serviceId) {
        router.push(`/client/services/${serviceId}/web-dev/forms`);
      } else {
        router.push('/client/forms');
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar formulário");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="bg-white border-b px-6 h-16 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{schema.title || 'Novo Formulário'}</h1>
            <p className="text-xs text-gray-500">{mode === 'create' ? 'Criando novo formulário' : 'Editando formulário'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-black hover:bg-gray-800 text-white">
            <Save size={16} />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </header>

      {/* Main Layout: 3 Columns */}
      <div className="flex-1 flex overflow-hidden gap-50">
        
        {/* Left Sidebar: Settings */}
        <aside className="w-80  border-r overflow-y-auto flex flex-col shrink-0 custom-scrollbar">
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings size={14} />
                Configurações Gerais
              </h3>
              
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs text-gray-600 font-medium">Título do Formulário</Label>
                  <Input
                    id="title"
                    value={schema.title}
                    onChange={(e) => updateFormMetadata(e.target.value, schema.description || '', schema.redirectUrl)}
                    placeholder="Ex: Contato"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs text-gray-600 font-medium">Descrição</Label>
                  <Textarea
                    id="description"
                    value={schema.description || ''}
                    onChange={(e) => updateFormMetadata(schema.title, e.target.value, schema.redirectUrl)}
                    placeholder="Breve descrição..."
                    className="resize-none h-20 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="redirectUrl" className="text-xs text-gray-600 font-medium">URL de Redirecionamento</Label>
                  <Input
                    id="redirectUrl"
                    value={schema.redirectUrl || ''}
                    onChange={(e) => updateFormMetadata(schema.title, schema.description || '', e.target.value)}
                    placeholder="https://..."
                    className="h-9 text-sm"
                  />
                  <p className="text-[10px] text-gray-400">Opcional: Para onde enviar após o envio.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database size={14} />
                Integrações
              </h3>

              <div className="space-y-4">
                {mode === 'create' ? (
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                    <Switch
                      id="create-datasource"
                      checked={createDataSource}
                      onCheckedChange={setCreateDataSource}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="create-datasource" className="text-sm font-medium cursor-pointer">
                        Criar Fonte de Dados
                      </Label>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Cria automaticamente uma tabela no CRM para receber estes dados.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-xs">
                    As integrações podem ser gerenciadas na aba de configurações do serviço.
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Preview Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-8 flex flex-col items-center custom-scrollbar">
          <div className={cn(
            "w-full transition-all duration-300 ease-in-out",
            previewMode === 'mobile' ? "max-w-[375px]" : "max-w-2xl"
          )}>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Eye size={16} />
                Preview em Tempo Real
              </h2>
              
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className={cn(
                    "h-7 w-7 p-0 rounded-md hover:bg-gray-100",
                    previewMode === 'desktop' && "bg-gray-100 text-black"
                  )}
                  title="Desktop"
                >
                  <Monitor size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className={cn(
                    "h-7 w-7 p-0 rounded-md hover:bg-gray-100",
                    previewMode === 'mobile' && "bg-gray-100 text-black"
                  )}
                  title="Mobile"
                >
                  <Smartphone size={14} />
                </Button>
              </div>
            </div>

            <div className={cn(
              "bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden transition-all duration-300",
              previewMode === 'mobile' && "border-[8px] border-gray-900 rounded-[2rem] shadow-xl"
            )}>
              {/* Form Header Preview */}
              <div className="bg-white border-b border-gray-100 p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{schema.title || 'Sem Título'}</h2>
                {schema.description && (
                  <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">{schema.description}</p>
                )}
              </div>

              {/* Fields Area */}
              <div className="p-8 space-y-6 min-h-[300px]">
                {schema.fields.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50/50">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
                      <LayoutTemplate size={24} />
                    </div>
                    <p className="text-gray-900 font-medium text-sm">Seu formulário está vazio</p>
                    <p className="text-gray-500 text-xs mt-1 max-w-[200px]">
                      Arraste ou clique nos campos à direita para começar a construir.
                    </p>
                  </div>
                ) : (
                  schema.fields.map((field, index) => (
                    <FieldEditor 
                      key={field.id} 
                      field={field} 
                      isFirst={index === 0} 
                      isLast={index === schema.fields.length - 1} 
                    />
                  ))
                )}
              </div>
              
              {/* Footer Preview */}
              <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-100 flex justify-end">
                <Button disabled className="w-full sm:w-auto bg-black text-white opacity-50 cursor-not-allowed">
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Toolbar */}
        <aside className="w-72 bg-white border-l overflow-y-auto shrink-0 custom-scrollbar">
          <div className="p-6">
            <Toolbar />
          </div>
        </aside>

      </div>
    </div>
  );
}
