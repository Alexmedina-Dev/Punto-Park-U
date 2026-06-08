// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Validators — form field validation for payment flows               ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ── Types ─────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export type ValidatorFn<T = string> = (value: T) => ValidationResult;

// ── Helpers ───────────────────────────────────────────────────────────

export function required(message = 'Este campo es requerido'): ValidatorFn {
  return (value: string) => ({
    valid: value.trim().length > 0,
    message: value.trim().length > 0 ? undefined : message,
  });
}

export function minLength(min: number, message?: string): ValidatorFn {
  return (value: string) => ({
    valid: value.length >= min,
    message: message || `Mínimo ${min} caracteres`,
  });
}

export function maxLength(max: number, message?: string): ValidatorFn {
  return (value: string) => ({
    valid: value.length <= max,
    message: message || `Máximo ${max} caracteres`,
  });
}

export function pattern(regex: RegExp, message: string): ValidatorFn {
  return (value: string) => ({
    valid: regex.test(value),
    message: regex.test(value) ? undefined : message,
  });
}

export function email(): ValidatorFn {
  return pattern(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    'Correo electrónico inválido'
  );
}

// ── Payment-specific ──────────────────────────────────────────────────

export function cardNumber(): ValidatorFn {
  return (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) {
      return { valid: false, message: 'Número de tarjeta inválido' };
    }
    if (!/^\d+$/.test(cleaned)) {
      return { valid: false, message: 'Solo números' };
    }
    // Luhn check
    let sum = 0;
    let alternate = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      if (alternate) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      alternate = !alternate;
    }
    return {
      valid: sum % 10 === 0,
      message: sum % 10 === 0 ? undefined : 'Número de tarjeta inválido',
    };
  };
}

export function cardExpiry(): ValidatorFn {
  return (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/^(\d{2})\/(\d{2,4})$/);
    if (!match) {
      return { valid: false, message: 'Formato MM/AA' };
    }

    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);

    if (month < 1 || month > 12) {
      return { valid: false, message: 'Mes inválido' };
    }

    const fullYear = year < 100 ? 2000 + year : year;
    const now = new Date();
    const expiryDate = new Date(fullYear, month);

    if (expiryDate < now) {
      return { valid: false, message: 'Tarjeta vencida' };
    }

    return { valid: true };
  };
}

export function cardCVC(): ValidatorFn {
  return (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 3 || cleaned.length > 4) {
      return { valid: false, message: 'CVC inválido' };
    }
    return { valid: true };
  };
}

export function phone(): ValidatorFn {
  return pattern(
    /^\+?[\d\s-]{7,15}$/,
    'Teléfono inválido'
  );
}

// ── Compose validators ────────────────────────────────────────────────

export function compose(...validators: ValidatorFn[]): ValidatorFn {
  return (value: string) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) return result;
    }
    return { valid: true };
  };
}

// ── Form validation helper ────────────────────────────────────────────

export interface FieldRules {
  [key: string]: ValidatorFn[];
}

export function validateForm<T extends Record<string, string>>(
  values: T,
  rules: FieldRules
): Record<keyof T, string | undefined> {
  const errors: Record<string, string | undefined> = {};

  for (const [field, validators] of Object.entries(rules)) {
    const value = values[field] || '';
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        errors[field] = result.message;
        break;
      }
    }
  }

  return errors as Record<keyof T, string | undefined>;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((e) => e !== undefined);
}
