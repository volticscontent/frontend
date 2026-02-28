"use client";

import React from 'react';
import { useFormBuilder } from '@/context/FormBuilderContext';
import { Button } from '@/components/ui/button';
import { Type, AlignLeft, Hash, Mail, List, Radio, CheckSquare, Calendar } from 'lucide-react';
import { FieldType } from '@/types/form-builder';

export function Toolbar() {
  const { addField } = useFormBuilder();

  const fieldTypes: { type: FieldType; icon: React.ReactNode; label: string }[] = [
    { type: 'text', icon: <Type size={16} />, label: 'Texto Curto' },
    { type: 'textarea', icon: <AlignLeft size={16} />, label: 'Texto Longo' },
    { type: 'number', icon: <Hash size={16} />, label: 'Número' },
    { type: 'email', icon: <Mail size={16} />, label: 'Email' },
    { type: 'select', icon: <List size={16} />, label: 'Seleção' },
    { type: 'radio', icon: <Radio size={16} />, label: 'Múltipla Escolha' },
    { type: 'checkbox', icon: <CheckSquare size={16} />, label: 'Checkbox' },
    { type: 'date', icon: <Calendar size={16} />, label: 'Data' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500">Campos Disponíveis</h3>
      <div className="grid grid-cols-1 gap-2">
        {fieldTypes.map((item) => (
          <Button
            key={item.type}
            variant="outline"
            className="justify-start gap-3 h-10 border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200"
            onClick={() => addField(item.type)}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
