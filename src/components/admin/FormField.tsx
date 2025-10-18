/**
 * Form Field - Reusable form field with validation
 */

'use client';

import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'number' | 'url' | 'textarea' | 'select';
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  placeholder,
  disabled,
  options,
  rows = 4,
  min,
  max,
  step,
  helpText,
}: FormFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) : e.target.value;
    onChange(name, newValue);
  };

  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
    error ? 'border-red-300 bg-red-50' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          className={inputClasses}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className={inputClasses}
        >
          <option value="">Select {label}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
        />
      )}

      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {error && (
        <div className="flex items-center space-x-1 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
