declare module 'sm-crypto' {
  export const sm2: {
    generateKeyPairHex(): { publicKey: string; privateKey: string }
    doSignature(msg: string, privateKey: string, options?: { userId?: string }): string
    doVerifySignature(msg: string, signString: string, publicKey: string, options?: { userId?: string }): boolean
    doEncrypt(msg: string, publicKey: string, mode?: 1 | 0): string
    doDecrypt(msg: string, privateKey: string, mode?: 1 | 0): string
  }

  export const sm3: (input: string) => string

  export const sm4: {
    encrypt(text: string, key: string, options?: { mode?: string; iv?: string }): string
    decrypt(text: string, key: string, options?: { mode?: string; iv?: string }): string
  }
}
