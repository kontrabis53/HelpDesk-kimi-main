import CryptoJS from 'crypto-js';

/** Должен совпадать с `src/utils/cryptoUtils.ts` во фронтенде */
const SYSTEM_MASTER_SEED = 'medin-helpdesk-secure-v1-2024';

export function generateChatKey(chatId: string): string {
  return CryptoJS.HmacSHA256(chatId, SYSTEM_MASTER_SEED).toString();
}

/** Перешифровать [ENC] сообщение при смене room id (личка → группа) */
export function transcryptMessage(text: string, fromChatId: string, toChatId: string): string {
  if (!text || !text.startsWith('[ENC]')) return text;
  try {
    const decryptKey = generateChatKey(fromChatId);
    const pureText = text.replace('[ENC]', '');
    const bytes = CryptoJS.AES.decrypt(pureText, decryptKey);
    const plain = bytes.toString(CryptoJS.enc.Utf8);
    if (!plain) return text;
    const encryptKey = generateChatKey(toChatId);
    return '[ENC]' + CryptoJS.AES.encrypt(plain, encryptKey).toString();
  } catch {
    return text;
  }
}
