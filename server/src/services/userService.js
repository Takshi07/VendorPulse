import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import {
  USER_ROLES,
  USER_STATUS,
} from "../domain/constants.js";

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function listUsers({
  page = 1,
  limit = 10,
  role,
  status,
  search,
} = {}) {
  const pageNumber = Math.max(
    Number.parseInt(page, 10) || 1,
    1
  );

  const limitNumber = Math.min(
    Math.max(Number.parseInt(limit, 10) || 10, 1),
    100
  );

  const filter = {};

  if (role) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw createError("Invalid user role", 400);
    }

    filter.role = role;
  }

  if (status) {
    if (!Object.values(USER_STATUS).includes(status)) {
      throw createError("Invalid user status", 400);
    }

    filter.status = status;
  }

  if (search?.trim()) {
    const escaped = search
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(escaped, "i");

    filter.$or = [
      { name: regex },
      { email: regex },
    ];
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

export async function createUser(data) {
  const {
    name,
    email,
    password,
    role,
  } = data;

  if (!name?.trim()) {
    throw createError("User name is required", 400);
  }

  if (!email?.trim()) {
    throw createError("Email is required", 400);
  }

  if (!password || password.length < 8) {
    throw createError(
      "Password must be at least 8 characters",
      400
    );
  }

  if (!Object.values(USER_ROLES).includes(role)) {
    throw createError("Invalid user role", 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role,
    status: USER_STATUS.ACTIVE,
  });

  return user;
}

export async function updateUser(id, data) {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid user ID", 400);
  }

  const user = await User.findById(id);

  if (!user) {
    throw createError("User not found", 404);
  }

  // v1 safeguard: existing Admin accounts cannot be
  // demoted or deactivated through the application.
  if (user.role === USER_ROLES.ADMIN) {
    if (
      data.role !== undefined &&
      data.role !== USER_ROLES.ADMIN
    ) {
      throw createError(
        "Admin accounts cannot be demoted",
        400
      );
    }

    if (
      data.status !== undefined &&
      data.status !== USER_STATUS.ACTIVE
    ) {
      throw createError(
        "Admin accounts cannot be deactivated",
        400
      );
    }
  }

  if (data.name !== undefined) {
    if (!data.name?.trim()) {
      throw createError("User name is required", 400);
    }

    user.name = data.name.trim();
  }

  if (data.role !== undefined) {
    if (!Object.values(USER_ROLES).includes(data.role)) {
      throw createError("Invalid user role", 400);
    }

    user.role = data.role;
  }

  if (data.status !== undefined) {
    if (!Object.values(USER_STATUS).includes(data.status)) {
      throw createError("Invalid user status", 400);
    }

    user.status = data.status;
  }

  await user.save();
  return user;
}