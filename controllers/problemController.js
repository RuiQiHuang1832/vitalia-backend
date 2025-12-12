import * as patientService from "../services/patientService.js";
import * as problemService from "../services/problemService.js";

export const createProblem = async (req, res, next) => {
  try {
    const { patientId, name, icdCode, description } = req.body;
    const providerId = req.user.id;

    // Basic validation
    if (!patientId || !providerId || !name) {
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
    const problem = await problemService.getProblemById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const updatedProblem = await problemService.updateProblem(problemId, update);
    res.status(200).json(updatedProblem);
  } catch (error) {
    next(error);
  }
};
