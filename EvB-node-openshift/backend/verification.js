import { webcrypto } from 'crypto'
import atob from 'atob'
const { subtle } = webcrypto

// verify
const verify = async (key, signature, data) => {
  const ec = new TextEncoder()
  const signatureString = atob(signature)
  const bufferSignature = str2ab(signatureString)
  const encodedData = ec.encode(data)
  const verified = await subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    bufferSignature,
    encodedData
  )
  return verified
}

// string to arrayBuffer
const str2ab = (str) => {
  const buf = new ArrayBuffer(str.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

// convert public.pem to cryptoKey
const importRsaKey = async (pem) => {
  const pemHeader = '-----BEGIN PUBLIC KEY-----'
  const pemFooter = '-----END PUBLIC KEY-----'
  const pemContents = pem.substring(
    pemHeader.length,
    pem.length - pemFooter.length
  )
  const binaryDerString = atob(pemContents)
  const binaryDer = str2ab(binaryDerString)

  return await subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    true,
    ['verify']
  )
}

export { verify, importRsaKey }
