import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { parseDob } from "../utils/validateDate.js";
import { validateEmail } from "../utils/validateEmail.js";
import { validatePhone } from "../utils/validatePhone.js";

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, dob, phone } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First and last name are required" });
    }

    if (!dob) {
      return res.status(400).json({ message: "Date of birth is required" });
    }

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    // Validate DOB format (YYYY-MM-DD)
    const { value: parsedDob, error: dobError } = parseDob(dob);
    if (dobError) {
      return res.status(400).json({ message: dobError });
    }


    const { value: cleanedPhone, error: phoneError } = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }

    const { value: cleanedEmail, error: emailError } = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    //Hash password
    const hashed = await bcrypt.hash(password, 10);

    //Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: "PATIENT",
      }
    });

    await prisma.patient.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        dob: parsedDob,
        phone: cleanedPhone,
        email: cleanedEmail,
      }
    })

    // Respond
    return res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Register error:", error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    // check if user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // store refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });
    // Respond with tokens
    return res.status(200).json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // check if token is provided
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // confirm token validity by checking signature
    let payload;
    try {
      // verify signature and expiration
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });
    // check if refresh token matches or is old token reuse
    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Refresh token reused or invalid" });
    }
    // generate new tokens
    const newRefreshToken = generateRefreshToken(user);
    const newAccessToken = generateAccessToken(user);
    // store refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });
    // Respond with new tokens
    return res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Refresh error:", error);
    next(error);
  }
};
