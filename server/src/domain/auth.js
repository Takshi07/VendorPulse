import jwt from "jsonwebtoken";

const SESSION_DURATION = "8h";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return secret;
}

export function createSessionToken(user) {
  return jwt.sign(
    {},
    getJwtSecret(),
    {
      algorithm: "HS256",
      expiresIn: SESSION_DURATION,
      subject: String(user._id),
    }
  );
}

export function verifySessionToken(token) {
  return jwt.verify(
    token,
    getJwtSecret(),
    {
      algorithms: ["HS256"],
    }
  );
}