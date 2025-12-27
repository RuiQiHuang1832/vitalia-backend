import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as userService from "../services/authService.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/auth",
});

const getAccessCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());
  res.cookie("accessToken", accessToken, getAccessCookieOptions());
};

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
    const jwtUser = userService.toJwtUser(user);

    // generate tokens
    const accessToken = generateAccessToken(jwtUser);
    const refreshToken = generateRefreshToken(jwtUser);
    const sessionStartedAt = new Date();

    // store refresh token in DB
    await userService.updateUserRefreshToken(user.id, refreshToken, sessionStartedAt, !!rememberMe);

    // set refresh token as httpOnly cookie
    setAuthCookies(res, { accessToken, refreshToken });

    // Respond with tokens
    return res.status(200).json({
      user: jwtUser,
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};
// Manually called when access token expired
// If refresh token is valid, issue new access and refresh tokens
// else respond with 401/403 as appropriate
// then ask users to login again
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
    const jwtUser = userService.toJwtUser(user);
    // generate new tokens
    const newRefreshToken = generateRefreshToken(jwtUser);
    const newAccessToken = generateAccessToken(jwtUser);
    // store refresh token in DB
    await userService.updateUserRefreshToken(user.id, newRefreshToken, user.sessionStartedAt, user.rememberMe);
    // rotate refresh token cookie
    setAuthCookies(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });


    return res.status(200).json({
      user: jwtUser,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    next(error);
  }
};

export const validate = async (req, res, next) => {
  res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    displayName: req.user.displayName,
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
