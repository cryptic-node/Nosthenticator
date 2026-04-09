import { createHmac } from "crypto";

function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of cleaned) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function generateHOTP(
  secret: string,
  counter: number,
  digits: number = 6,
  algorithm: string = "SHA1"
): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));

  const algoMap: Record<string, string> = {
    SHA1: "sha1",
    SHA256: "sha256",
    SHA512: "sha512",
  };

  const hmac = createHmac(algoMap[algorithm] ?? "sha1", key);
  hmac.update(buf);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const otp =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return (otp % Math.pow(10, digits)).toString().padStart(digits, "0");
}

export function generateTOTP(
  secret: string,
  digits: number = 6,
  period: number = 30,
  algorithm: string = "SHA1"
): { code: string; timeRemaining: number } {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / period);
  const timeRemaining = period - (epoch % period);

  return {
    code: generateHOTP(secret, counter, digits, algorithm),
    timeRemaining,
  };
}

export function generateHOTPCode(
  secret: string,
  counter: number,
  digits: number = 6,
  algorithm: string = "SHA1"
): string {
  return generateHOTP(secret, counter, digits, algorithm);
}
