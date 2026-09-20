import express from "express";
import {
  getConfig,
  addEvaluation,
  getEvaluations,
  getEvaluation,
} from "../controllers/evaluationController.js";

import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/authorize.js";
import { USER_ROLES } from "../domain/constants.js";

const router = express.Router();

router.use(requireAuth);

// Get current evaluation configuration
router.get(
  "/evaluation-config",
  allowRoles(
    USER_ROLES.ADMIN,
    USER_ROLES.PROCUREMENT_MANAGER
  ),
  getConfig
);

// Create a new evaluation
router.post(
  "/evaluations",
  allowRoles(
    USER_ROLES.ADMIN,
    USER_ROLES.PROCUREMENT_MANAGER
  ),
  addEvaluation
);

// List evaluations
router.get(
  "/evaluations",
  allowRoles(
    USER_ROLES.ADMIN,
    USER_ROLES.PROCUREMENT_MANAGER,
    USER_ROLES.VIEWER
  ),
  getEvaluations
);

// Get one evaluation
router.get(
  "/evaluations/:id",
  allowRoles(
    USER_ROLES.ADMIN,
    USER_ROLES.PROCUREMENT_MANAGER,
    USER_ROLES.VIEWER
  ),
  getEvaluation
);

export default router;