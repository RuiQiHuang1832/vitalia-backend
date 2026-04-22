import prisma from "../src/lib/prisma.js";

// Returns paginated, unified list of users across all roles.
// Each row is keyed on the User record, with first/last name and status
// pulled from the related patient or provider profile when applicable.
export const getAllUsers = async (page, limit, role) => {
  const skip = (page - 1) * limit;

  const where = role ? { role } : {};

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        patient: {
          select: { id: true, firstName: true, lastName: true, status: true },
        },
        provider: {
          select: { id: true, firstName: true, lastName: true, status: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data = users.map((u) => {
    const profile = u.patient ?? u.provider ?? null;
    return {
      userId: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      status: profile?.status ?? null,
      profileId: profile?.id ?? null,
    };
  });

  const totalPages = Math.ceil(totalCount / limit);

  return { data, totalCount, totalPages, page, limit };
};

// Toggles provider active/inactive status via the user id.
// Only providers have admin-toggleable status; patient status is clinical.
export const updateProviderStatusByUserId = async (userId, status) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { provider: { select: { id: true } } },
  });

  if (!user) return { error: "NOT_FOUND" };
  if (user.role !== "PROVIDER") return { error: "NOT_PROVIDER" };
  if (!user.provider) return { error: "NO_PROFILE" };

  const provider = await prisma.provider.update({
    where: { id: user.provider.id },
    data: { status },
  });

  return { provider, user };
};
