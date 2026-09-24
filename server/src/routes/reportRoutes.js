import express from "express";

import {
  getReport,
  exportReportCsv,
  exportReportPdf,
} from "../controllers/reportController.js";

import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/authorize.js";
import { USER_ROLES } from "../domain/constants.js";

const router = express.Router();

router.use(requireAuth);

router.use(
  allowRoles(
    USER_ROLES.ADMIN,
    USER_ROLES.PROCUREMENT_MANAGER,
    USER_ROLES.VIEWER
  )
);

router.get("/evaluations", getReport);

router.get(
  "/evaluations.csv",
  exportReportCsv
);

router.get(
  "/evaluations.pdf",
  exportReportPdf
);

export default router;
