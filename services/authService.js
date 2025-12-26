import prisma from "../src/lib/prisma.js";

export const getUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      patient: { select: { firstName: true } },
      provider: { select: { firstName: true } },
    }
  });
}

export const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      patient: { select: { firstName: true } },
      provider: { select: { firstName: true } },
    }
  });
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



export const toJwtUser = (user) => {
  const displayName =
    (user.role === "PATIENT" && user.patient?.firstName) ||
    ((user.role === "PROVIDER") && user.provider?.firstName) ||
    "Admin";

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName,
  };
};
