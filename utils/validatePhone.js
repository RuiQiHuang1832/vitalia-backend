// Validates phone number format and trims whitespace
export const validatePhone = (phone) => {
  if (typeof phone !== "string") {
    return { error: "Invalid phone number" };
  }

  const trimmed = phone.trim();

  if (trimmed.length < 7) {
    return { error: "Invalid phone number" };
  }

  return { value: trimmed };
};
