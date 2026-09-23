import express from "express";

import {
  getKpis,
  getKpi,
  addKpi,
  editKpi,
  adjustKpiWeights,
} from "../controllers/kpiController.js";

import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/authorize.js";
import { USER_ROLES } from "../domain/constants.js";

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  allowRoles(USER_ROLES.ADMIN),
  getKpis
);

router.post(
  "/",
  allowRoles(USER_ROLES.ADMIN),
  addKpi
);

router.put(
  "/weights",
  allowRoles(USER_ROLES.ADMIN),
  adjustKpiWeights
);

router.get(
  "/:id",
  allowRoles(USER_ROLES.ADMIN),
  getKpi
);

router.patch(
  "/:id",
  allowRoles(USER_ROLES.ADMIN),
  editKpi
);

export default router;