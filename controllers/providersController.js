import { logAudit } from "../services/auditLogService.js";
import * as providerService from "../services/providerService.js";
import { validateEmail } from "../utils/validateEmail.js";
import { validatePhone } from "../utils/validatePhone.js";
export const createProvider = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, specialty, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !specialty || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    //  Normalize
    const cleaned = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      specialty: specialty.trim(),
    };

    //  Validate email / phone
    const { error: emailError } = validateEmail(cleaned.email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    const { error: phoneError } = validatePhone(cleaned.phone);
    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }

    const existing = await providerService.getProviderByEmail(cleaned.email);
    if (existing) {
      return res
        .status(409)
        .json({ message: "Email already in use by another provider" });
    }

    const result = await providerService.createProviderWithUser({
      email: cleaned.email,
      password,
      firstName: cleaned.firstName,
      lastName: cleaned.lastName,
      phone: cleaned.phone,
      specialty: cleaned.specialty,
    });
    await logAudit({
      user: req.user,
      action: 'CREATE',
      entity: 'PROVIDER',
      entityId: result.provider.id,
      details: { provider: result.provider }
    });
    return res.status(201).json({
      id: result.provider.id,
      userId: result.user.id,
      email: result.user.email,
      firstName: result.provider.firstName,
      lastName: result.provider.lastName,
      specialty: result.provider.specialty,
      role: result.user.role,
      createdAt: result.user.createdAt,
    });
  } catch (error) {
    console.error("Error creating provider:", error);
    next(error);
  }
};


export const getProvider = async (req, res, next) => {
  try {
    // Get provider by ID
    const { id } = req.params;
    // Validate ID is a number
    const providerId = Number(id);
    // If NaN, return 400
    if (isNaN(providerId)) {
      return res.status(400).json({ message: "Invalid provider ID" });
    }
    // Fetch provider
    const provider = await providerService.getProviderById(providerId);
    // If not found, return 404
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    res.status(200).json(provider);
  } catch (error) {
    next(error);
  }
}

export const getAllProviders = async (req, res, next) => {
  try {
    // Handle pagination
    const { page, limit } = req.query;
    const pageNumber = page ? Number(page) : 1;
    const limitNumber = limit ? Number(limit) : 10;
    // Validate numeric & positive
    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ message: "Invalid page number" });
    }

    if (isNaN(limitNumber) || limitNumber < 1) {
      return res.status(400).json({ message: "Invalid limit value" });
    }
    // Fetch providers
    const providers = await providerService.getAllProviders(pageNumber, limitNumber);
    res.status(200).json(providers);
  } catch (error) {
    next(error);
  }
}

export const updateProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const providerId = Number(id);
    // Validate ID is a number
    if (isNaN(providerId)) {
      return res.status(400).json({ message: "Invalid provider ID" });
    }
    // Check if provider exists
    const existing = await providerService.getProviderById(providerId);
    if (!existing) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const { firstName, lastName, specialty, email, phone } = req.body;

    // Prepare updates object
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (specialty !== undefined) updates.specialty = specialty.trim();
    if (email !== undefined) {
      const { value: cleanedEmail, error: emailError } = validateEmail(email);
      if (emailError) {
        return res.status(400).json({ message: emailError });
      }
      // Check for email uniqueness
      const other = await providerService.getProviderByEmail(email);
      if (other && other.id !== providerId) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = cleanedEmail;
    }
    if (phone !== undefined) {
      const { value: cleanedPhone, error: phoneError } = validatePhone(phone);
      if (phoneError) {
        return res.status(400).json({ message: phoneError });
      }
      updates.phone = cleanedPhone;
    }

    // Perform update
    const provider = await providerService.updateProvider(providerId, updates);
    res.status(200).json(provider);
  } catch (error) {
    next(error);
  }
}

export const deleteProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    const providerId = Number(id);
    // Validate ID is a number
    if (isNaN(providerId)) {
      return res.status(400).json({ message: "Invalid provider ID" });
    }
    // Check if provider exists
    const existing = await providerService.getProviderById(providerId);
    if (!existing) {
      return res.status(404).json({ message: "Provider not found" });
    }
    // Delete provider
    await providerService.deleteProvider(providerId);
    res.status(200).json({ message: "Provider deleted successfully" });
  } catch (error) {
    next(error);
  }
}
