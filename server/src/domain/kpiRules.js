import { KPI_STATUS } from "./constants.js";

export function getActiveKpiWeightTotal(kpis) {
  return kpis
    .filter((kpi) => kpi.status === KPI_STATUS.ACTIVE)
    .reduce((total, kpi) => total + Number(kpi.weight), 0);
}

export function validateActiveKpiWeights(kpis) {
  const activeKpis = kpis.filter(
    (kpi) => kpi.status === KPI_STATUS.ACTIVE
  );

  if (activeKpis.length === 0) {
    return {
      valid: false,
      total: 0,
      message: "At least one active KPI is required",
    };
  }

  const total = getActiveKpiWeightTotal(kpis);

  if (Math.abs(total - 100) > 0.000001) {
    return {
      valid: false,
      total,
      message: "Active KPI weights must total exactly 100%",
    };
  }

  return {
    valid: true,
    total,
    message: null,
  };
}