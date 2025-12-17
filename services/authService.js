import prisma from "../src/lib/prisma.js";

export const getUserByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
}

export const getUserById = async (id) => {
  return await prisma.user.findUnique({ where: { id } });
}

export const updateUserRefreshToken = async (id, refreshToken, sessionStartedAt, rememberMe) => {
  return await prisma.user.update({
    where: { id },
    data: { refreshToken, sessionStartedAt, rememberMe },
  });
}

export const logoutByRefreshToken = async (refreshToken) => {
  return await prisma.user.updateMany({
    where: { refreshToken },
    data: { refreshToken: null },
  });
}

