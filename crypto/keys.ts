// ブラウザとNode.js環境の両方でWeb Crypto APIにアクセスするためのグローバルオブジェクトを使用
const webcrypto = globalThis.crypto;

// 鍵ペアの形式定義
export type KeyPair = {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
};

// 鍵のエクスポート形式
export type ExportedKeyPair = {
  publicKey: JsonWebKey; // JWK形式
  encryptedPrivateKey: string; // 暗号化された秘密鍵 (Base64エンコード)
};

/**
 * ユーザーの公開鍵/秘密鍵ペア (RSA-OAEP) を生成します。
 * 秘密鍵はエクスポート可能として生成されます。
 * @returns 生成された鍵ペア
 */
export async function generateRsaKeyPair(): Promise<KeyPair> {
  // RSA-OAEP アルゴリズムパラメータ
  const algorithm = {
    name: 'RSA-OAEP',
    modulusLength: 4096, // 鍵長
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
    hash: 'SHA-256',
  };

  // 鍵の用途 (公開鍵: 暗号化, 秘密鍵: 復号)
  const usages: KeyUsage[] = ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'];

  const keyPair = await webcrypto.subtle.generateKey(algorithm, true, usages);
  return keyPair as KeyPair;
}

/**
 * データ暗号化キー (DEK) 用の対称鍵 (AES-GCM) を生成します。
 * @returns 生成された対称鍵
 */
export async function generateAesDek(): Promise<CryptoKey> {
  const algorithm = {
    name: 'AES-GCM',
    length: 256, // 鍵長
  };
  const usages: KeyUsage[] = ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'];
  const key = await webcrypto.subtle.generateKey(algorithm, true, usages);
  return key as CryptoKey;
}

/**
 * 公開鍵をJWK形式でエクスポートします。
 * @param publicKey エクスポートする公開鍵
 * @returns JWK形式の公開鍵
 */
export async function exportPublicKey(
  publicKey: CryptoKey,
): Promise<JsonWebKey> {
  return webcrypto.subtle.exportKey('jwk', publicKey);
}

/**
 * 秘密鍵をJWK形式でエクスポートし、指定されたパスフレーズで暗号化します。
 * @param privateKey エクスポートする秘密鍵
 * @param passphrase 秘密鍵を暗号化するためのパスフレーズ (例: マスターパスワード、認証トークンから派生した鍵)
 * @returns 暗号化された秘密鍵 (Base64エンコード)
 */
export async function exportAndEncryptPrivateKey(
  privateKey: CryptoKey,
  passphrase: string,
): Promise<string> {
  const exportedJwk = await webcrypto.subtle.exportKey('jwk', privateKey);
  const jsonString = JSON.stringify(exportedJwk);
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(jsonString);

  // パスフレーズから鍵を派生
  const salt = webcrypto.getRandomValues(new Uint8Array(16)); // ソルトを生成
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );
  const derivedKey = await webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 繰り返し回数 (セキュリティ強度に影響)
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  // AES-GCMで秘密鍵を暗号化
  const iv = webcrypto.getRandomValues(new Uint8Array(12)); // IVを生成
  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    derivedKey,
    data,
  );

  // ソルト、IV、暗号化データを結合してBase64エンコード
  const combined = new Uint8Array(
    salt.length + iv.length + encrypted.byteLength,
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * 暗号化された秘密鍵を復号し、CryptoKeyオブジェクトとしてインポートします。
 * @param encryptedPrivateKey Base64エンコードされた暗号化秘密鍵
 * @param passphrase 秘密鍵を復号するためのパスフレーズ
 * @returns 復号された秘密鍵 (CryptoKey)
 */
export async function decryptAndImportPrivateKey(
  encryptedPrivateKey: string,
  passphrase: string,
): Promise<CryptoKey> {
  const decoded = atob(encryptedPrivateKey);
  const combined = new Uint8Array(
    decoded.split('').map((char) => char.charCodeAt(0)),
  );

  const saltLength = 16;
  const ivLength = 12;

  const salt = combined.slice(0, saltLength);
  const iv = combined.slice(saltLength, saltLength + ivLength);
  const encryptedData = combined.slice(saltLength + ivLength);

  const textEncoder = new TextEncoder();
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );
  const derivedKey = await webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  const decrypted = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    derivedKey,
    encryptedData,
  );

  const decryptedJwk = JSON.parse(new TextDecoder().decode(decrypted));
  return webcrypto.subtle.importKey(
    'jwk',
    decryptedJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true, // 秘密鍵はエクスポート可能
    ['decrypt', 'unwrapKey'],
  );
}

/**
 * JWK形式の公開鍵をCryptoKeyオブジェクトとしてインポートします。
 * @param jwk JWK形式の公開鍵
 * @returns CryptoKeyオブジェクトの公開鍵
 */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return webcrypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true, // 公開鍵はエクスポート可能
    ['encrypt', 'wrapKey'],
  );
}

// クライアントサイドでの秘密鍵の安全な保存と取得（IndexedDBの利用を推奨）
// ここでは簡易的なLocalStorageの例を示すが、本番ではIndexedDBを検討
const PRIVATE_KEY_STORAGE_KEY = 'poohma_encrypted_private_key';

/**
 * 暗号化された秘密鍵をクライアントサイドストレージに保存します。
 * @param encryptedPrivateKey Base64エンコードされた暗号化秘密鍵
 */
export function saveEncryptedPrivateKeyToStorage(
  encryptedPrivateKey: string,
): void {
  localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, encryptedPrivateKey);
}

/**
 * クライアントサイドストレージから暗号化された秘密鍵を取得します。
 * @returns Base64エンコードされた暗号化秘密鍵、またはnull
 */
export function getEncryptedPrivateKeyFromStorage(): string | null {
  return localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
}
