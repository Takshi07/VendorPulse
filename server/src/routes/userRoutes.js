import express from "express";

import {
  getUsers,
  addUser,
  editUser,
} from "../controllers/userController.js";

import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/authorize.js";
import { USER_ROLES } from "../domain/constants.js";

const router = express.Router();

router.use(requireAuth);
router.use(allowRoles(USER_ROLES.ADMIN));

router.get("/", getUsers);
router.post("/", addUser);
router.patch("/:id", editUser);

export default router;