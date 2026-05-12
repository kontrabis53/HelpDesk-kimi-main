"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatKey = generateChatKey;
exports.transcryptMessage = transcryptMessage;
const crypto_js_1 = __importDefault(require("crypto-js"));
/** Должен совпадать с `src/utils/cryptoUtils.ts` во фронтенде */
const SYSTEM_MASTER_SEED = 'medin-helpdesk-secure-v1-2024';
function generateChatKey(chatId) {
    return crypto_js_1.default.HmacSHA256(chatId, SYSTEM_MASTER_SEED).toString();
}
/** Перешифровать [ENC] сообщение при смене room id (личка → группа) */
function transcryptMessage(text, fromChatId, toChatId) {
    if (!text || !text.startsWith('[ENC]'))
        return text;
    try {
        const decryptKey = generateChatKey(fromChatId);
        const pureText = text.replace('[ENC]', '');
        const bytes = crypto_js_1.default.AES.decrypt(pureText, decryptKey);
        const plain = bytes.toString(crypto_js_1.default.enc.Utf8);
        if (!plain)
            return text;
        const encryptKey = generateChatKey(toChatId);
        return '[ENC]' + crypto_js_1.default.AES.encrypt(plain, encryptKey).toString();
    }
    catch {
        return text;
    }
}
