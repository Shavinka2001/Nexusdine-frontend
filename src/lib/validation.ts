export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Sri Lankan mobile: +947XXXXXXXX / 07XXXXXXXX / 7XXXXXXXX */
export function isValidSriLankanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s()-]/g, "");
  return /^(?:\+94|0)?7\d{8}$/.test(cleaned);
}

export function normalizeSriLankanPhone(phone: string): string {
  const cleaned = phone.replace(/[\s()-]/g, "");
  if (cleaned.startsWith("+94")) return cleaned;
  if (cleaned.startsWith("0")) return `+94${cleaned.slice(1)}`;
  if (cleaned.startsWith("7") && cleaned.length === 9) return `+94${cleaned}`;
  return cleaned;
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export type FieldErrors<T extends string> = Partial<Record<T, string>>;
