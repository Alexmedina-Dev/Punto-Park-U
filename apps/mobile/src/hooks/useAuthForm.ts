import { useState, useCallback, useMemo } from 'react';
import {
  VALIDATION,
  ERROR_MESSAGES,
} from '../constants/auth';

// ── Types ──────────────────────────────────────────────────────────────

type ValidationRule<T> = {
  validate: (value: string, values: T) => string | null;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

export interface UseAuthFormOptions<T extends Record<string, string>> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
}

export interface UseAuthFormReturn<T extends Record<string, string>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T) => (value: string) => void;
  handleBlur: (field: keyof T) => () => void;
  setFieldValue: (field: keyof T, value: string) => void;
  setFieldTouched: (field: keyof T) => void;
  validateAll: () => boolean;
  setSubmitting: (submitting: boolean) => void;
  resetForm: (newValues?: T) => void;
  setServerError: (field: keyof T, error: string) => void;
}

// ── Built-in validators ────────────────────────────────────────────────

export const validators = {
  required: <T>(fieldLabel: string): ValidationRule<T> => ({
    validate: (value) =>
      value.trim().length === 0 ? ERROR_MESSAGES.required(fieldLabel) : null,
  }),

  email: <T>(): ValidationRule<T> => ({
    validate: (value) =>
      value && !VALIDATION.email.test(value) ? ERROR_MESSAGES.email : null,
  }),

  cedula: <T>(): ValidationRule<T> => ({
    validate: (value) =>
      value && !VALIDATION.cedula.test(value) ? ERROR_MESSAGES.cedula : null,
  }),

  username: <T>(): ValidationRule<T> => ({
    validate: (value) =>
      value && !VALIDATION.username.test(value) ? ERROR_MESSAGES.username : null,
  }),

  password: <T>(): ValidationRule<T> => ({
    validate: (value) =>
      value && !VALIDATION.password.test(value) ? ERROR_MESSAGES.password : null,
  }),

  passwordMatch: <T extends Record<string, string>>(
    compareField: keyof T
  ): ValidationRule<T> => ({
    validate: (value, values) =>
      value !== values[compareField] ? ERROR_MESSAGES.passwordMatch : null,
  }),
};

// ── Hook ───────────────────────────────────────────────────────────────

export function useAuthForm<T extends Record<string, string>>({
  initialValues,
  validationRules = {} as ValidationRules<T>,
}: UseAuthFormOptions<T>): UseAuthFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setSubmitting] = useState(false);

  // ── Validate a single field ──
  const validateField = useCallback(
    (field: keyof T, value: string, allValues: T): string | null => {
      const rules = validationRules[field];
      if (!rules) return null;

      for (const rule of rules) {
        const error = rule.validate(value, allValues);
        if (error) return error;
      }

      return null;
    },
    [validationRules]
  );

  // ── Handle field change ──
  const handleChange = useCallback(
    (field: keyof T) => (value: string) => {
      setValues((prev) => {
        const newValues = { ...prev, [field]: value };

        // Validate on change if field was already touched
        if (touched[field]) {
          const error = validateField(field, value, newValues);
          setErrors((prevErrors) => ({
            ...prevErrors,
            [field]: error || undefined,
          }));
        }

        return newValues;
      });
    },
    [touched, validateField]
  );

  // ── Handle field blur ──
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prevErrors) => {
        const error = validateField(field, values[field], values);
        return { ...prevErrors, [field]: error || undefined };
      });
    },
    [validateField, values]
  );

  // ── Set field value directly ──
  const setFieldValue = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── Set field touched ──
  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // ── Validate all fields ──
  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasError = false;

    const fieldKeys = Object.keys(values) as (keyof T)[];
    for (const field of fieldKeys) {
      const error = validateField(field, values[field], values);
      if (error) {
        newErrors[field] = error;
        hasError = true;
      }
    }

    // Mark all fields as touched
    const allTouched = {} as Partial<Record<keyof T, boolean>>;
    for (const field of fieldKeys) {
      allTouched[field] = true;
    }

    setErrors(newErrors);
    setTouched(allTouched);

    return !hasError;
  }, [validateField, values]);

  // ── Computed: is form valid? ──
  const isValid = useMemo(() => {
    const fieldKeys = Object.keys(values) as (keyof T)[];
    for (const field of fieldKeys) {
      const error = validateField(field, values[field], values);
      if (error) return false;
    }
    return true;
  }, [validateField, values]);

  // ── Reset form ──
  const resetForm = useCallback(
    (newValues?: T) => {
      setValues(newValues || initialValues);
      setErrors({});
      setTouched({});
      setSubmitting(false);
    },
    [initialValues]
  );

  // ── Set server-side error ──
  const setServerError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldTouched,
    validateAll,
    setSubmitting,
    resetForm,
    setServerError,
  };
}
