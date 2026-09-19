import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(plaintext: string, hash: string) {
    return await bcrypt.compare(plaintext, hash);
}