import * as providerService from "../services/providerService.js";
import { validateEmail } from "../utils/validateEmail.js";
import { validatePhone } from "../utils/validatePhone.js";

export const createProvider = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, specialty } = req.body;
    // Basic validation
    if (!firstName || !lastName || !email || !phone || !specialty) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // trim strings
    const cleaned = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      specialty: specialty.trim(),
    };

    // Validate email and phone
    const { error: emailError } = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    const { error: phoneError } = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }
    // Check for email uniqueness
    const existing = await providerService.getProviderByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already in use by another provider" });
    }

    // Create provider
    const provider = await providerService.createProvider(cleaned);
    res.status(201).json(provider);

  } catch (error) {
    console.error("Error creating provider:", error);
    next(error);
  }
}

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
