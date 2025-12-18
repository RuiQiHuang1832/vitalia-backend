import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userService from "../services/authService.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // find user by email
    const user = await userService.getUserByEmail(email);
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
    const sessionStartedAt = new Date();

    // store refresh token in DB
    await userService.updateUserRefreshToken(user.id, refreshToken, sessionStartedAt, !!rememberMe);

    // set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth",
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    // Respond with tokens
    return res.status(200).json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    //httpOnly cookie with refresh token only this can read it
    const refreshToken = req.cookies.refreshToken;
    const DAY = 1000 * 60 * 60 * 24;
    // Flow: Check token presence -> verify signature & expiration -> check DB match -> check session expiry -> issue new tokens

    // check if token is provided
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    // confirm token validity by checking signature
    let payload;
    try {
      // verify signature and expiration
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const user = await userService.getUserById(payload.id);

    // check if refresh token matches or is old token reuse
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Refresh token reused or invalid" });
    }
    // check session expiration based on rememberMe
    const MAX_SESSION_AGE = user.rememberMe ? 30 * DAY : 7 * DAY;

    if (Date.now() - user.sessionStartedAt.getTime() > MAX_SESSION_AGE) {
      res.clearCookie("refreshToken", { path: "/auth" });
      res.clearCookie("accessToken", { path: "/" });
      return res.status(401).json({ message: "Session expired" });
    }

    // generate new tokens
    const newRefreshToken = generateRefreshToken(user);
    const newAccessToken = generateAccessToken(user);
    // store refresh token in DB
    await userService.updateUserRefreshToken(user.id, newRefreshToken, user.sessionStartedAt, user.rememberMe);
    // rotate refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth",
    });
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    //  only return access token
    return res.status(200).json({
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    next(error);
  }
};

export const validate = async (req, res, next) => {
  res.status(200).json({
    id: req.user.id,
    role: req.user.role,
  });
}

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      // Clear refresh token in DB (best-effort)
      await userService.logoutByRefreshToken(refreshToken);
    }
    // Clear cookie regardless
    res.clearCookie("refreshToken", { path: "/auth" });
    res.clearCookie("accessToken", { path: "/" });

    return res.sendStatus(204);
  } catch (error) {
    console.error("Login error:", error);
    next(error);

  }
}
