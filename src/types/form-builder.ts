export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'select' | 'radio' | 'checkbox' | 'date';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: FieldOption[]; // For select, radio, checkbox
  mappingKey?: string; // Key for data source mapping (e.g. email, first_name)
}

export interface FormSchema {
  id?: string;
  title: string;
  description?: string;
  redirectUrl?: string;
  fields: FormField[];
}
