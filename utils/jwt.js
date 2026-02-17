import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign({
    id: user.id,
    email: user.email,
    role: user.role,
    providerId: user.providerId ?? null,
    patientId: user.patientId ?? null,
  }, process.env.JWT_SECRET, {
    expiresIn: "7d" // 15m
  })
}

export const generateRefreshToken = (user) => {
  return jwt.sign({
    id: user.id
  }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d"
  })
}
