import prisma from "../src/lib/prisma.js";

export const getUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      patient: { select: { firstName: true, id:true } },
      provider: { select: { firstName: true, id: true } },
    }
  });
}

export const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      patient: { select: { firstName: true, id:true } },
      provider: { select: { firstName: true, id: true } },
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
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    providerId: user.provider?.id || null,
    patientId: user.patient?.id || null,
  };
};
