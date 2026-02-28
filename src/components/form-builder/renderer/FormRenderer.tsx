"use client";

import React, { useState } from 'react';
import { FormSchema } from '@/types/form-builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitForm } from '@/services/forms';
import { toast } from 'sonner';

interface FormRendererProps {
  formId?: string;
  schema: FormSchema;
  preview?: boolean;
}

export function FormRenderer({ formId, schema, preview = false }: FormRendererProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validStep = Math.min(currentStep, Math.max(0, schema.fields.length - 1));
  const activeStep = schema.fields.length === 0 ? 0 : validStep;

  // Reset step when schema changes (important for builder preview)
  if (preview && currentStep !== activeStep) {
    setCurrentStep(activeStep);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) return;
    
    if (!formId) {
      toast.error("Erro de configuração: ID do formulário ausente");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitForm(formId, answers);
      toast.success("Formulário enviado com sucesso!");
      
      if (schema.redirectUrl) {
          window.location.href = schema.redirectUrl;
      } else {
          // Reset or show success state
          setAnswers({});
          setCurrentStep(0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar formulário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < schema.fields.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAnswer = (value: unknown) => {
     if (preview && !value) return; // Allow typing in preview without state if complex
     const fieldId = schema.fields[currentStep].id;
     setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  // Variants for slide animation
  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      y: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  if (schema.fields.length === 0) {
    return (
      <div className="text-center py-20 text-gray-300 italic text-xl">
        O formulário está vazio.
      </div>
    );
  }

  const currentField = schema.fields[currentStep];
  const isLastStep = currentStep === schema.fields.length - 1;
  const progress = ((currentStep + 1) / schema.fields.length) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 flex flex-col h-full min-h-[400px]">
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1 mb-8 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-black"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>

      <div className="mb-8">
        {currentStep === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight leading-tight">{schema.title}</h1>
                {schema.description && (
                <p className="text-lg text-gray-500 leading-relaxed">{schema.description}</p>
                )}
            </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col relative">
        <AnimatePresence mode='wait' custom={direction}>
          <motion.div
            key={currentField.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="flex-1"
          >
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="flex-none text-sm font-bold text-black mt-1.5 border border-black px-2 py-0.5 rounded">
                   {currentStep + 1} <ArrowRight size={10} className="inline ml-0.5" />
                </span>
                <div className="w-full">
                  <Label htmlFor={currentField.id} className="text-2xl sm:text-3xl font-medium text-gray-900 mb-6 block leading-tight">
                    {currentField.label}
                    {currentField.required && <span className="text-red-500 ml-1 text-lg align-top">*</span>}
                  </Label>
                  
                  {currentField.helpText && (
                    <p className="text-base text-gray-500 mb-6 -mt-4">{currentField.helpText}</p>
                  )}
                  
                  <div className="min-h-[120px]">
                  {currentField.type === 'text' && (
                    <Input
                      id={currentField.id}
                      placeholder={currentField.placeholder || "Digite sua resposta..."}
                      required={currentField.required}
                      disabled={preview}
                      autoFocus
                      className="text-2xl h-16 border-b-2 border-x-0 border-t-0 rounded-none bg-transparent px-2 focus:ring-0 border-gray-300 focus:border-black focus:bg-gray-50/50 transition-all placeholder:text-gray-400 w-full"
                      value={(answers[currentField.id] as string | number) || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isLastStep) {
                              e.preventDefault();
                              handleNext();
                          }
                      }}
                    />
                  )}

                  {currentField.type === 'email' && (
                    <Input
                      id={currentField.id}
                      type="email"
                      placeholder={currentField.placeholder || "exemplo@email.com"}
                      required={currentField.required}
                      disabled={preview}
                      autoFocus
                      className="text-2xl h-16 border-b-2 border-x-0 border-t-0 rounded-none bg-transparent px-2 focus:ring-0 border-gray-300 focus:border-black focus:bg-gray-50/50 transition-all placeholder:text-gray-400 w-full"
                      value={(answers[currentField.id] as string | number) || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLastStep) {
                            e.preventDefault();
                            handleNext();
                        }
                    }}
                    />
                  )}

                  {currentField.type === 'number' && (
                    <Input
                      id={currentField.id}
                      type="number"
                      placeholder={currentField.placeholder}
                      required={currentField.required}
                      disabled={preview}
                      autoFocus
                      className="text-2xl h-16 border-b-2 border-x-0 border-t-0 rounded-none bg-transparent px-2 focus:ring-0 border-gray-300 focus:border-black focus:bg-gray-50/50 transition-all placeholder:text-gray-400 w-full"
                      value={(answers[currentField.id] as string | number) || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLastStep) {
                            e.preventDefault();
                            handleNext();
                        }
                    }}
                    />
                  )}
                  
                  {currentField.type === 'date' && (
                    <Input
                      id={currentField.id}
                      type="date"
                      required={currentField.required}
                      disabled={preview}
                      autoFocus
                      className="text-2xl h-16 border-b-2 border-x-0 border-t-0 rounded-none bg-transparent px-2 focus:ring-0 border-gray-300 focus:border-black focus:bg-gray-50/50 transition-all placeholder:text-gray-400 w-auto min-w-[200px]"
                      value={(answers[currentField.id] as string) || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                    />
                  )}

                  {currentField.type === 'textarea' && (
                    <textarea
                      id={currentField.id}
                      className="flex min-h-[160px] w-full rounded-none border-b-2 border-x-0 border-t-0 border-gray-300 bg-transparent px-2 py-2 text-2xl placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-gray-50/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-sans transition-colors"
                      placeholder={currentField.placeholder || "Digite sua resposta longa..."}
                      required={currentField.required}
                      disabled={preview}
                      autoFocus
                      value={(answers[currentField.id] as string) || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                    />
                  )}

                  {currentField.type === 'select' && (
                    <select
                      id={currentField.id}
                      className="flex h-16 w-full rounded-none border-b-2 border-x-0 border-t-0 border-gray-300 bg-transparent px-2 py-2 text-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-gray-50/50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-colors"
                      required={currentField.required}
                      disabled={preview}
                      autoFocus
                      value={(answers[currentField.id] as string) || ''}
                      onChange={(e) => handleAnswer(e.target.value)}
                    >
                      <option value="" disabled>Selecione uma opção</option>
                      {currentField.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-8 pt-8 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-gray-400 hover:text-black"
          >
            <ChevronUp size={20} className="mr-2 rotate-[-90deg]" />
            Anterior
          </Button>

          {isLastStep ? (
            <Button type="submit" size="lg" className="bg-black text-white hover:bg-gray-800 rounded-xl px-8" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : (
                <>Enviar <Check size={20} className="ml-2" /></>
              )}
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={handleNext} className="bg-black text-white hover:bg-gray-800 rounded-xl px-8">
              Próximo <ChevronDown size={20} className="ml-2 rotate-[-90deg]" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
