"use client";

import React from 'react';
import { FormField } from '@/types/form-builder';
import { useFormBuilder } from '@/context/FormBuilderContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowUp, ArrowDown, Plus, X, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface FieldEditorProps {
  field: FormField;
  isLast: boolean;
  isFirst: boolean;
}

export function FieldEditor({ field, isFirst, isLast }: FieldEditorProps) {
  const { updateField, removeField, moveField } = useFormBuilder();

  const handleOptionChange = (index: number, value: string) => {
    if (!field.options) return;
    const newOptions = [...field.options];
    newOptions[index].label = value;
    newOptions[index].value = value; // Keeping simple for now
    updateField(field.id, { options: newOptions });
  };

  const addOption = () => {
    if (!field.options) return;
    updateField(field.id, {
      options: [...field.options, { label: `Nova Opção ${field.options.length + 1}`, value: `op${Date.now()}` }]
    });
  };

  const removeOption = (index: number) => {
    if (!field.options) return;
    const newOptions = field.options.filter((_, i) => i !== index);
    updateField(field.id, { options: newOptions });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 group"
    >
      <Card className="p-6 border-l-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-xs font-bold uppercase bg-black text-white px-3 py-1.5 rounded-full tracking-wider">
              {field.type}
            </span>
            <Input
              value={field.label}
              onChange={(e) => updateField(field.id, { label: e.target.value })}
              className="font-bold text-xl bg-transparent border-transparent hover:bg-gray-100 focus:bg-white px-2 -ml-2 w-full max-w-md shadow-none"
              placeholder="Título da Pergunta"
            />
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full w-8 h-8"
              onClick={() => moveField(field.id, 'up')}
              disabled={isFirst}
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full w-8 h-8"
              onClick={() => moveField(field.id, 'down')}
              disabled={isLast}
            >
              <ArrowDown size={14} />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full w-8 h-8 ml-2"
              onClick={() => removeField(field.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-gray-500 uppercase text-xs tracking-wider mb-2">Texto de Exemplo</Label>
              <Input
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                placeholder="Digite um texto de exemplo..."
              />
            </div>
            <div>
              <Label className="text-gray-500 uppercase text-xs tracking-wider mb-2">Chave de Mapeamento (DataSource)</Label>
              <Input
                value={field.mappingKey || ''}
                onChange={(e) => updateField(field.id, { mappingKey: e.target.value })}
                placeholder="ex: email, nome_completo (opcional)"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer select-none p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${field.required ? 'bg-black border-black' : 'border-gray-300 bg-white'}`}>
                  {field.required && <CheckSquare size={12} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                className="hidden"
              />
              Resposta Obrigatória
            </label>
          </div>

          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <Label className="mb-4 block text-gray-500 uppercase text-xs tracking-wider">Opções de Resposta</Label>
              <div className="space-y-3">
                {field.options?.map((option, idx) => (
                  <div key={idx} className="flex gap-3 items-center group/option">
                    <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <Input
                      value={option.label}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="bg-white border-gray-200 h-10 shadow-none"
                    />
                    <Button
                      variant="ghost"
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/option:opacity-100 transition-opacity h-10 w-10 p-0 rounded-full"
                      onClick={() => removeOption(idx)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addOption} className="w-full mt-4 border-dashed border-2 bg-transparent hover:bg-white hover:border-solid">
                  <Plus size={16} className="mr-2" /> Adicionar Opção
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
