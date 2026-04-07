import * as patientService from "../services/patientService.js";
import * as problemService from "../services/problemService.js";
import * as providerService from "../services/providerService.js";
import { logAudit, patientLabel } from "../services/auditLogService.js";

export const createProblem = async (req, res, next) => {
  try {
    const { patientId, name, icdCode, description } = req.body;

    const user = await providerService.getProviderByUserId(req.user.id);
    if (!user?.provider) {
      return res.status(403).json({ message: "Forbidden: You are not a provider" });
    }
    const providerId = user.provider.id;

    // Basic validation
    if (!patientId || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const patientIdNum = Number(patientId);

    if (isNaN(patientIdNum)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    // Verify patient exists
    const patient = await patientService.getPatientById(patientIdNum);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    // Create problem
    const problem = await problemService.createProblem({
      patientId: patientIdNum,
      providerId: providerId,
      name,
      icdCode,
      description,
    });
    await logAudit({
      user: req.user,
      action: 'CREATE',
      entity: 'PROBLEM',
      entityId: problem.id,
      details: {
        description: `Added problem "${problem.name}" for ${patientLabel(patient)}`,
        problem,
      }
    });
    res.status(201).json(problem);
  } catch (error) {
    next(error);
  }
};


export const getProblemsForPatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientIdNum = Number(id);
    if (isNaN(patientIdNum)) {
      return res.status(400).json({ message: "patientId is required and must be a number" });
    }
    // Verify patient exists
    const patient = await patientService.getPatientById(patientIdNum);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    // Fetch problems
    const problems = await problemService.getProblemsByPatientId(patientIdNum);
    res.status(200).json(problems);

  } catch (error) {
    next(error);
  }
};

export const getProblemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const problemId = Number(id);
    if (isNaN(problemId)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }
    //Fetch problem
    const problem = await problemService.getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "No problem found" });
    }
    res.status(200).json(problem);
  } catch (error) {
    next(error);
  }
};

export const updateProblem = async (req, res, next) => {
  try {
    const { name, icdCode, description, status } = req.body;
    const { id } = req.params;
    const problemId = Number(id);
    if (isNaN(problemId)) {
      return res.status(400).json({ message: "Invalid problem ID" });
    }
    const problem = await problemService.getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }
    const update = {};
    if (status !== undefined) {
      update.status = status;
      if (status == "RESOLVED") {
        update.resolvedAt = new Date();
      } else if (status == "ACTIVE") {
        update.resolvedAt = null;
      }
    }
    if (name !== undefined) update.name = name;
    if (icdCode !== undefined) update.icdCode = icdCode;
    if (description !== undefined) update.description = description;


    const updatedProblem = await problemService.updateProblem(problemId, update);
    const patient = await patientService.getPatientById(problem.patientId);

    await logAudit({
      user: req.user,
      action: 'UPDATE',
      entity: 'PROBLEM',
      entityId: problemId,
      details: {
        description: `Updated problem "${updatedProblem.name}" for ${patientLabel(patient)}`,
        previousData: problem,
        updatedData: updatedProblem,
      }
    });
    res.status(200).json(updatedProblem);
  } catch (error) {
    next(error);
  }
};
