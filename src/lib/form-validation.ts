/**
 * Form Validation - Reusable validation utilities
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface ValidationErrors {
  [field: string]: string;
}

export function validateForm(data: any, rules: ValidationRules): ValidationErrors {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const rule = rules[field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = 'This field is required';
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rule.required) {
      return;
    }

    // String length validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = `Must be at least ${rule.minLength} characters`;
        return;
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `Must be at most ${rule.maxLength} characters`;
        return;
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = 'Invalid format';
        return;
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors[field] = `Must be at least ${rule.min}`;
        return;
      }

      if (rule.max !== undefined && value > rule.max) {
        errors[field] = `Must be at most ${rule.max}`;
        return;
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors[field] = customError;
        return;
      }
    }
  });

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  version: /^\d+\.\d+\.\d+$/,
  hexColor: /^#[0-9A-Fa-f]{6}$/,
};

// Common validation rules
export const COMMON_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  email: {
    required: true,
    pattern: VALIDATION_PATTERNS.email,
  },
  url: {
    pattern: VALIDATION_PATTERNS.url,
  },
  description: {
    maxLength: 500,
  },
  version: {
    required: true,
    pattern: VALIDATION_PATTERNS.version,
  },
};
