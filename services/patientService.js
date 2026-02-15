import bcrypt from "bcrypt";
import prisma from "../src/lib/prisma.js";

export const createPatientWithUser = async ({
  email,
  password,
  firstName,
  lastName,
  dob,
  phone,
}) => {

  const hashedPassword = await bcrypt.hash(password, 10);
  // Use transaction to ensure both user and patient are created
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "PATIENT",
      },
    });

    const patient = await tx.patient.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        dob,
        phone,
        email,
      },
    });

    return { user, patient };
  });
};

// Returns patient by ID or null if not found
export const getPatientById = async (id) => {
  return await prisma.patient.findUnique({ where: { id } });
}

export const getPatientByUserId = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: { patient: true },
  });
}


// Returns paginated list of patients
export const getAllPatients = async (page, limit) => {
  const skip = (page - 1) * limit;

  const [patients, totalCount] = await Promise.all([
    prisma.patient.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        appointments: {
          where: {
            status: 'COMPLETED',
            startTime: {
              lte: new Date(),
            },
          },
          orderBy: {
            startTime: 'desc',
          },
          take: 1,
          select: {
            startTime: true,
          },
        },
      },
    }),
    prisma.patient.count(),
  ]);

  return {
    data: patients,
    totalCount,
    page,
    limit,
  };
};

// Updates patient by ID with provided data
export const updatePatientAndUser = async (patientId, userId, data) => {
  return prisma.$transaction(async (tx) => {
    // If email is being changed, update the auth user's email too
    if (data.email !== undefined && userId) {
      await tx.user.update({
        where: { id: userId },
        data: { email: data.email },
      });
    }

    const patient = await tx.patient.update({
      where: { id: patientId },
      data,
    });

    return patient;
  });
};


// Deletes patient by ID
export const deletePatient = async (id) => {
  return await prisma.patient.delete({
    where: { id },
  });
}

// Checks for existing patient by email or phone
export const checkDuplicatePatient = async (email, phone) => {
  const [existingEmail, existingPhone] = await Promise.all([
    prisma.patient.findFirst({ where: { email } }),
    prisma.patient.findFirst({ where: { phone } })
  ]);

  return { existingEmail, existingPhone };
};


export const checkExistingPatientByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });

}
