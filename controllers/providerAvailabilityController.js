import { logAudit } from "../services/auditLogService.js";
import * as providerAvailabilityService from "../services/providerAvailabilityService.js";
import * as providerService from "../services/providerService.js";

// Validate "HH:mm" format and return [hours, minutes] or null
function parseTime(str) {
  if (typeof str !== 'string') return null;
  const match = str.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return [h, m];
}

// Convert "HH:mm" to total minutes for comparison
function timeToMinutes(str) {
  const [h, m] = parseTime(str);
  return h * 60 + m;
}

export const createProviderAvailability = async (req, res, next) => {
  try {
    const { startTime, endTime, workingDays } = req.body;
    const providerId = req.user.id;

    // Basic validation
    if (!startTime || !endTime || !workingDays || !Array.isArray(workingDays) || workingDays.length === 0) {
      return res.status(400).json({ message: "Missing or invalid required fields" });
    }

    if (!parseTime(startTime) || !parseTime(endTime)) {
      return res.status(400).json({ message: "startTime and endTime must be in HH:mm format" });
    }

    const provider = await providerService.getProviderById(providerId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    //Check if availability already exists for provider
    const existingAvailability = await providerAvailabilityService.getProviderAvailabilityByProviderId(providerId);
    if (existingAvailability) {
      return res.status(409).json({ message: "Availability already exists for this provider" });
    }

    //Check startTime < endTime
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({ message: "startTime must be before endTime" });
    }

    const availability = await providerAvailabilityService.createProviderAvailability({
      providerId,
      startTime,
      endTime,
      workingDays,
    });
    await logAudit({
      user: req.user,
      action: 'CREATE',
      entity: 'PROVIDER_AVAILABILITY',
      entityId: availability.id,
      details: { availability }
    });
    res.status(201).json(availability);

  } catch (error) {
    next(error);
  }
};

export const getProviderAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const providerId = Number(id);
    if (isNaN(providerId)) {
      return res.status(400).json({ message: "Invalid availability ID" });
    }
    const availability = await providerAvailabilityService.getProviderAvailabilityByProviderId(providerId);
    if (!availability) {
      return res.status(404).json({ message: "Provider availability not found" });
    }
    if (req.user.role === 'PROVIDER' && availability.providerId !== req.user.providerId) {
      return res.status(403).json({ message: "You do not have permission to view this availability" });
    }

    await logAudit({
      user: req.user,
      action: 'VIEW',
      entity: 'PROVIDER_AVAILABILITY',
      entityId: availability.id,
      details: {
        viewed: 'PROVIDER_AVAILABILITY'
      }
    });
    res.json(availability);
  } catch (error) {
    next(error);
  }
};

export const updateProviderAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, workingDays } = req.body;
    const availabilityIdNum = Number(id);

    // Basic validation
    if (isNaN(availabilityIdNum)) {
      return res.status(400).json({ message: "Invalid availability ID" });
    }

    const availability = await providerAvailabilityService.getAvailabilityById(availabilityIdNum);
    if (!availability) {
      return res.status(404).json({ message: "Provider availability not found" });
    }

    if (req.user.role === 'PROVIDER' && availability.providerId !== req.user.providerId) {
      return res.status(403).json({ message: "You do not have permission to update this availability" });
    }

    const update = {};

    // Time updates
    let start = availability.startTime;
    let end = availability.endTime;

    if (startTime !== undefined) {
      if (!parseTime(startTime)) return res.status(400).json({ message: "startTime must be in HH:mm format" });
      start = startTime;
    }
    if (endTime !== undefined) {
      if (!parseTime(endTime)) return res.status(400).json({ message: "endTime must be in HH:mm format" });
      end = endTime;
    }

    if (timeToMinutes(start) >= timeToMinutes(end)) {
      return res.status(400).json({ message: "Start time cannot be >= end time" });
    }

    update.startTime = start;
    update.endTime = end;
    if (workingDays !== undefined) {
      if (!Array.isArray(workingDays) || workingDays.length === 0) {
        return res.status(400).json({ message: "workingDays must be a non-empty array" });
      }
      update.workingDays = workingDays;
    }
    const updatedAvailability = await providerAvailabilityService.updateProviderAvailability(availabilityIdNum, update);
    await logAudit({
      user: req.user,
      action: 'UPDATE',
      entity: 'PROVIDER_AVAILABILITY',
      entityId: updatedAvailability.id,
      details: { updatedAvailability }
    });
    res.json(updatedAvailability);
  } catch (error) {
    next(error);
  }
};
