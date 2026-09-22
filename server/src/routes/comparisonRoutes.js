import express from "express";

import {
  getComparison,
} from "../controllers/comparisonController.js";

import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/authorize.js";
import { USER_ROLES } from "../domain/constants.js";

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  allowRoles(
    USER_ROLES.ADMIN,
    USER_ROLES.PROCUREMENT_MANAGER,
    USER_ROLES.VIEWER
  ),
  getComparison
);

export default router;