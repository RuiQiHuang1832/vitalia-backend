// Validates email format and trims whitespace
export const validateEmail = (email) => {
  if (typeof email !== "string") {
    return { error: "Invalid email format" };
  }

  const trimmed = email.trim();

  if (!trimmed.includes("@")) {
    return { error: "Invalid email format" };
  }

  return { value: trimmed };
};
