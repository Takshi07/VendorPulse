import express from "express";

import {
  login,
  getMe,
  logout,
} from "../controllers/authController.js";

import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/logout", logout);

export default router;