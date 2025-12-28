import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fixDates = (obj: any): any => {
  if (!obj) return obj;
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(fixDates);
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(k => obj[k] = fixDates(obj[k]));
  }
  return obj;
};
