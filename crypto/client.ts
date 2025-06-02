// ブラウザとNode.js環境の両方でWeb Crypto APIにアクセスするためのグローバルオブジェクトを使用
const webcrypto = globalThis.crypto;

// 暗号化されたデータの形式定義
export type EncryptedData = {
  ciphertext: string; // Base64エンコードされた暗号文
  iv: string; // Base64エンコードされたIV
};

// 暗号化されたDEKの形式定義
export type EncryptedDekForUser = {
  encryptedDek: string; // Base64エンコードされた暗号化DEK
};

/**
 * パスワードヒントの文字列を対称鍵 (DEK) で暗号化します (AES-GCM)。
 * @param hintText 暗号化するパスワードヒントの平文
 * @param dek 対称鍵 (DEK)
 * @returns 暗号化されたデータ (Base64エンコードされた暗号文とIV)
 */
export async function encryptPasswordHint(
  hintText: string,
  dek: CryptoKey,
): Promise<EncryptedData> {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(hintText);
  const iv = webcrypto.getRandomValues(new Uint8Array(12)); // IVを生成

  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    dek,
    data,
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * 対称鍵 (DEK) で暗号化されたパスワードヒントを復号します (AES-GCM)。
 * @param encryptedData 暗号化されたデータ (Base64エンコードされた暗号文とIV)
 * @param dek 対称鍵 (DEK)
 * @returns 復号されたパスワードヒントの平文
 */
export async function decryptPasswordHint(
  encryptedData: EncryptedData,
  dek: CryptoKey,
): Promise<string> {
  const ciphertext = new Uint8Array(
    atob(encryptedData.ciphertext)
      .split('')
      .map((char) => char.charCodeAt(0)),
  );
  const iv = new Uint8Array(
    atob(encryptedData.iv)
      .split('')
      .map((char) => char.charCodeAt(0)),
  );

  const decrypted = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    dek,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * 対称鍵 (DEK) を指定された公開鍵で暗号化します (RSA-OAEP)。
 * これは、DEKを特定のユーザーと共有するために使用されます。
 * @param dek 暗号化する対称鍵 (DEK)
 * @param publicKey 暗号化に使用する公開鍵 (対象ユーザーの公開鍵)
 * @returns 暗号化されたDEK (Base64エンコード)
 */
export async function encryptDekWithPublicKey(
  dek: CryptoKey,
  publicKey: CryptoKey,
): Promise<EncryptedDekForUser> {
  // DEKをraw形式でエクスポート
  const exportedDek = await webcrypto.subtle.exportKey('raw', dek);

  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    exportedDek,
  );

  return {
    encryptedDek: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  };
}

/**
 * 公開鍵で暗号化されたDEKを、指定された秘密鍵で復号します (RSA-OAEP)。
 * @param encryptedDek Base64エンコードされた暗号化DEK
 * @param privateKey 復号に使用する秘密鍵 (現在のユーザーの秘密鍵)
 * @returns 復号された対称鍵 (DEK)
 */
export async function decryptDekWithPrivateKey(
  encryptedDek: string,
  privateKey: CryptoKey,
): Promise<CryptoKey> {
  const ciphertext = new Uint8Array(
    atob(encryptedDek)
      .split('')
      .map((char) => char.charCodeAt(0)),
  );

  const decrypted = await webcrypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    ciphertext,
  );

  // 復号されたDEKをCryptoKeyとしてインポート
  return webcrypto.subtle.importKey(
    'raw',
    decrypted,
    { name: 'AES-GCM', length: 256 },
    true, // エクスポート可能
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
  );
}
