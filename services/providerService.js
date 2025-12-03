import prisma from "../src/lib/prisma.js";

// Data is a clean payload prepared in the controller
// This service does zero validation, that belongs to controller/middleware
// Returns the created provider record
export const createProvider = async (data) => {
  return await prisma.provider.create({ data });
}
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
