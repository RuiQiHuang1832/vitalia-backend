
import prisma from "../src/lib/prisma.js";

export const createProviderAvailability = async (data) => {
  return await prisma.providerAvailability.create({data});
}

export const getProviderAvailabilityByProviderId = async (providerId) => {
  return await prisma.providerAvailability.findUnique({
    where: { providerId},
  });
}

export const updateProviderAvailability = async (id, update) => {
  return await prisma.providerAvailability.update({
    where: { id },
    data: update,
  });
}

export const getAvailabilityById = async (id) => {
  return await prisma.providerAvailability.findUnique({
    where: { id },
  });
}
