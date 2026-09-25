import bcrypt from "bcryptjs";

const PASSWORD_HASH_ROUNDS = 12;

export function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

export function isPasswordHash(value) {
  if (typeof value !== "string") return false;

  try {
    return bcrypt.getRounds(value) > 0;
  } catch {
    return false;
  }
}
