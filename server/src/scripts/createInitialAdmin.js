import "dotenv/config";
import bcrypt from "bcryptjs";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import {
  USER_ROLES,
  USER_STATUS,
} from "../domain/constants.js";

async function createInitialAdmin() {
  try {
    await connectDB();

    const name = process.env.INITIAL_ADMIN_NAME;
    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required"
      );
    }

    if (password.length < 8) {
      throw new Error(
        "Initial admin password must be at least 8 characters"
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      throw new Error(
        "A user with this email already exists"
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: USER_ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    console.log("Initial Admin created successfully");
    console.log("Admin ID:", admin._id.toString());
    console.log("Email:", admin.email);

    process.exit(0);
  } catch (error) {
    console.error("Failed to create initial Admin");
    console.error(error.message);
    process.exit(1);
  }
}

createInitialAdmin();