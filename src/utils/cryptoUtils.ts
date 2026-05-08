import CryptoJS from 'crypto-js';

// Это ваш секретный Мастер-ключ. 
// В идеале он не должен храниться в коде, но для работы системы нам нужен 
// механизм обмена ключами. Мы будем использовать его для "запечатывания" ключей комнат.
const SYSTEM_MASTER_SEED = 'medin-helpdesk-secure-v1-2024';

export const cryptoUtils = {
  /**
   * Генерирует уникальный симметричный ключ для конкретного чата на основе его ID
   */
  generateChatKey(chatId: string): string {
    return CryptoJS.HmacSHA256(chatId, SYSTEM_MASTER_SEED).toString();
  },

  /**
   * Шифрует сообщение ключом чата
   */
  encryptMessage(text: string, chatId: string): string {
    if (!text) return '';
    const key = this.generateChatKey(chatId);
    // Добавляем префикс [ENC], чтобы отличать зашифрованные сообщения от старых
    return '[ENC]' + CryptoJS.AES.encrypt(text, key).toString();
  },

  /**
   * Расшифровывает сообщение ключом чата
   */
  decryptMessage(encryptedText: string, chatId: string): string {
    if (!encryptedText || !encryptedText.startsWith('[ENC]')) return encryptedText;
    
    try {
      const pureText = encryptedText.replace('[ENC]', '');
      const key = this.generateChatKey(chatId);
      const bytes = CryptoJS.AES.decrypt(pureText, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || '[Ошибка расшифровки]';
    } catch (e) {
      console.error('Decryption error:', e);
      return '[Ошибка дешифрования]';
    }
  },

  /**
   * Метод для администратора: расшифровка ЛЮБОГО сообщения при наличии системного сида
   */
  adminDecrypt(encryptedText: string, chatId: string, masterSeed: string): string {
    if (!encryptedText || !encryptedText.startsWith('[ENC]')) return encryptedText;
    
    try {
      const pureText = encryptedText.replace('[ENC]', '');
      const key = CryptoJS.HmacSHA256(chatId, masterSeed).toString();
      const bytes = CryptoJS.AES.decrypt(pureText, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || '[Неверный мастер-ключ]';
    } catch (e) {
      return '[Ошибка: неверный ключ или данные повреждены]';
    }
  }
};
