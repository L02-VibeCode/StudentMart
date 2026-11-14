import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";

const dummySalt = randomBytes(16).toString("hex");
const dummyHash = `scrypt$16384$8$1$${dummySalt}$${scryptSync(randomBytes(32), dummySalt, 64).toString("hex")}`;
export async function verifyPassword(password: string, encoded?: string): Promise<boolean> {
  const parts = (encoded ?? dummyHash).split("$");
  const valid = parts.length === 6 && parts[0] === "scrypt" && parts[1] === "16384" && parts[2] === "8" && parts[3] === "1"
    && /^[0-9a-f]{32}$/.test(parts[4]) && /^[0-9a-f]{128}$/.test(parts[5]);
  const [, , , , salt, hash] = valid ? parts : dummyHash.split("$");
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, value) => error ? reject(error) : resolve(value));
  });
  const matches = timingSafeEqual(key, Buffer.from(hash, "hex"));
  return !!encoded && valid && matches;
}
