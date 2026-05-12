import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Removes Zalgo/combining characters that can cause UI issues or freezes.
 * Matches Unicode range U+0300 to U+036F (Combining Diacritical Marks).
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  // This regex removes combining diacritical marks used for Zalgo text
  return text.replace(/[\u0300-\u036f]/g, "");
}

/**
 * Checks if text contains Zalgo-like characters (excessive combining marks).
 */
export function isZalgo(text: string): boolean {
  if (!text) return false;
  const zalgoMatch = text.match(/[\u0300-\u036f]/g);
  // If more than 5 combining marks are found in the message, it's likely Zalgo
  return zalgoMatch ? zalgoMatch.length > 5 : false;
}

/**
 * Checks if a string consists only of emojis and whitespace.
 */
export function isOnlyEmojis(text: string): boolean {
  if (!text) return false;
  
  // Remove whitespace
  const cleanText = text.replace(/\s/g, '');
  if (!cleanText) return false;

  // This regex matches emoji characters.
  // It includes basic emojis, variation selectors, skin tones, and ZWJ sequences.
  const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/;
  
  return emojiRegex.test(cleanText);
}

/**
 * Имя для обращения (не фамилия). Для формата ФИО «Фамилия Имя Отчество» берётся второе слово;
 * если слово одно — используется оно.
 */
export function getGivenName(fullName?: string | null, fallback = 'коллега'): string {
  if (!fullName?.trim()) return fallback;
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return parts[0];
}
