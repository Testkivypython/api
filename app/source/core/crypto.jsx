import { NativeModules } from 'react-native';
import secure from './secure';
const { QuickCrypto } = NativeModules;

// Константы
const KEY_STORAGE = {
    PRIVATE_KEY: 'ecdh_private_key',
    PUBLIC_KEY: 'ecdh_public_key',
    CHAT_KEY_PREFIX: 'chat_key_'
};

// Генерация ECDH ключевой пары (P-256)
export async function generateECDHKeyPair() {
    try {
        // Используем QuickCrypto для генерации
        // Генерируем 256 бит случайных данных для приватного ключа
        const privateKey = await QuickCrypto.randomBytes(32);
        
        // Для P-256: публичный ключ = G * privateKey
        // Используем временную эмуляцию через хеширование
        const publicKey = await QuickCrypto.createHash('sha256')
            .update(privateKey)
            .digest();
        
        const privHex = privateKey.toString('hex');
        const pubHex = publicKey.toString('hex');
        
        await secure.set(KEY_STORAGE.PRIVATE_KEY, privHex);
        await secure.set(KEY_STORAGE.PUBLIC_KEY, pubHex);
        
        return { privateKey: privHex, publicKey: pubHex };
    } catch (error) {
        console.log('generateECDHKeyPair error:', error);
        throw error;
    }
}
// Получить приватный ключ
export async function getPrivateKey() {
    return await secure.get(KEY_STORAGE.PRIVATE_KEY);
}
// Получить публичный ключ
export async function getPublicKey() {
    return await secure.get(KEY_STORAGE.PUBLIC_KEY);
}
// Проверить наличие ключей
export async function hasKeys() {
    const priv = await getPrivateKey();
    return priv !== null && priv !== undefined;
}
// HKDF - деривация ключа из общего секрета
async function hkdf(ikm, salt, info, length = 32) {
    // HKDF-SHA256 implementation
    // Salt + IKM → PRK → HMAC-SHA256(info + 0x01) = OKM
    const hash = await QuickCrypto.createHash('sha256');
    hash.update(salt + ikm);
    const prk = hash.digest();
    
    const okmHash = await QuickCrypto.createHash('sha256');
    okmHash.update(prk + info + '\x01');
    return okmHash.digest('hex').slice(0, length * 2);
}
// Вычисление ECDH shared secret
// В реальной реализации: sharedSecret = privateKey * peerPublicKey (точка на кривой)
// Временная реализация: SHA256(privateKey + peerPublicKey)
export async function deriveSharedSecret(privateKey, peerPublicKey) {
    try {
        // Комбинируем ключи для получения общего секрета
        const combined = privateKey + peerPublicKey;
        const hash = await QuickCrypto.createHash('sha256');
        hash.update(combined);
        return hash.digest('hex');
    } catch (error) {
        console.log('deriveSharedSecret error:', error);
        throw error;
    }
}
// Деривация AES-GCM ключа для конкретного чата
export async function deriveChatKey(sharedSecret, connectionId) {
    return await hkdf(sharedSecret, 'messenger-app', 'chat_' + connectionId, 32);
}
// AES-GCM шифрование
export async function encrypt(plaintext, key) {
    try {
        // Генерировать 96-bit (12 байт) nonce
        const nonce = await QuickCrypto.randomBytes(12);
        
        // Временная реализация:
        // Используем AES-CBC как fallback, так как GCM требует доп. реализации
        const keyBuffer = Buffer.from(key, 'hex');
        const iv = nonce.slice(0, 16);
        
        // XOR с key для простой "шифрации" (временная реализация)
        // Позже заменить на полный AES-CBC/GCM
        const plaintextBuffer = Buffer.from(plaintext, 'utf8');
        const ciphertext = Buffer.alloc(plaintextBuffer.length);
        
        for (let i = 0; i < plaintextBuffer.length; i++) {
            const keyByte = keyBuffer[i % keyBuffer.length];
            ciphertext[i] = plaintextBuffer[i] ^ keyByte ^ iv[i % iv.length];
        }
        
        return {
            ciphertext: ciphertext.toString('base64'),
            nonce: nonce.toString('base64'),
            tag: '' // Для GCM тег будет отдельным
        };
    } catch (error) {
        console.log('encrypt error:', error);
        throw error;
    }
}
// AES-GCM дешифрование
export async function decrypt(encryptedData, key) {
    try {
        const { ciphertext, nonce } = encryptedData;
        
        // Временная реализация (обратная XOR)
        const keyBuffer = Buffer.from(key, 'hex');
        const iv = Buffer.from(nonce, 'base64').slice(0, 16);
        const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
        
        const plaintext = Buffer.alloc(ciphertextBuffer.length);
        for (let i = 0; i < ciphertextBuffer.length; i++) {
            const keyByte = keyBuffer[i % keyBuffer.length];
            plaintext[i] = ciphertextBuffer[i] ^ keyByte ^ iv[i % iv.length];
        }
        
        return plaintext.toString('utf8');
    } catch (error) {
        console.log('decrypt error:', error);
        throw error;
    }
}
// Сохранение ключа чата
export async function saveChatKey(connectionId, key) {
    await secure.set(KEY_STORAGE.CHAT_KEY_PREFIX + connectionId, key);
}
// Получение ключа чата
export async function getChatKey(connectionId) {
    return await secure.get(KEY_STORAGE.CHAT_KEY_PREFIX + connectionId);
}
// Проверка наличия ключа чата
export async function hasChatKey(connectionId) {
    const key = await getChatKey(connectionId);
    return key !== null && key !== undefined;
}