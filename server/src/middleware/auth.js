import User from "../models/User.js";
import { verifySessionToken } from "../domain/auth.js";
import { USER_STATUS } from "../domain/constants.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.vp_session;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const payload = verifySessionToken(token);

    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return res.status(403).json({
        message: "User account is inactive",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }
}