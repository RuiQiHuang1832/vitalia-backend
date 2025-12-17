import prisma from "../src/lib/prisma.js";
import bcrypt from "bcrypt";

export const createProviderWithUser = async ({
  email,
  password,
  firstName,
  lastName,
  phone,
  specialty,
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "PROVIDER",
      },
    });

    const provider = await tx.provider.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        phone,
        specialty,
        email
      },
    });

    return { user, provider };
  });
};

// Returns provider by ID or null if not found
export const getProviderById = async (id) => {
  return await prisma.provider.findUnique({ where: { id } });
}

// Returns paginated list of providers
export const getAllProviders = async (page, limit) => {
  const skip = (page - 1) * limit;

  const [providers, totalCount] = await Promise.all([
    prisma.provider.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.provider.count(),
  ]);

  return {
    data: providers,
    totalCount,
    page,
    limit,
  };
};

// Updates provider by ID with provided data
export const updateProvider = async (id, data) => {
  return await prisma.provider.update({
    where: { id },
    data,
  });
}

// Deletes provider by ID
export const deleteProvider = async (id) => {
  return await prisma.provider.delete({
    where: { id },
  });
}

// Checks for existing provider by email
export const getProviderByEmail = async (email) => {
  return await prisma.provider.findUnique({ where: { email } });
}
