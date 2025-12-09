import prisma from "../src/lib/prisma.js";

// Visit Note Services
export const createVisitNote = async (data) => {
  return await prisma.visitNote.create({ data });
}

export const getVisitNoteByAppointmentId = async (appointmentId) => {
  return await prisma.visitNote.findFirst({
    where: { appointmentId },
  });
}

export const getLatestVisitNoteEntry = async (visitNote) => {
  return await prisma.visitNoteEntry.findFirst({
    where: {
      visitNoteId: visitNote.id,
      version: visitNote.latestVersion
},
  });
}

export const createVisitNoteEntry = async (data) => {
  const lastEntry = await prisma.visitNoteEntry.findFirst({
    where: { visitNoteId: data.visitNoteId },
    orderBy: { version: 'desc' }
  });

  const nextVersion = lastEntry ? lastEntry.version + 1 : 1;

  await prisma.visitNote.update({
    where: { id: data.visitNoteId },
    data: { latestVersion: nextVersion }, // will set after creating entry
  });

  return await prisma.visitNoteEntry.create({ data: { ...data, version: nextVersion,  } });
}

export const getVisitNoteById = async (id) => {
  return await prisma.visitNote.findUnique({
    where: { id },
  });
};

export const getAllVisitNoteEntries = async (visitNoteId) => {
  return await prisma.visitNoteEntry.findMany({
    where: { visitNoteId },
    orderBy: { version: 'asc' }
  });
}
