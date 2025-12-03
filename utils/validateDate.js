// Validates and parses date of birth in YYYY-MM-DD format
export const parseDob = (dob) => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  // Must match YYYY-MM-DD
  if (!isoDateRegex.test(dob)) {
    return { error: "DOB must be in YYYY-MM-DD format" };
  }

  const parsed = new Date(dob);

  // Must be a real date
  if (isNaN(parsed.getTime())) {
    return { error: "Invalid date of birth" };
  }

  return { value: parsed };
};
