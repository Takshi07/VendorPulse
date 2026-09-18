import crypto from "crypto";

export function generateCriteriaSignature(kpis) {
  const canonicalCriteria = kpis
    .map((kpi) => ({
      kpiId: String(kpi._id),
      name: kpi.name.trim(),
      weightUnits: Math.round(Number(kpi.weight) * 100),
    }))
    .sort((a, b) => a.kpiId.localeCompare(b.kpiId));

  const canonicalJson = JSON.stringify(
    canonicalCriteria.map((kpi) => [
      kpi.kpiId,
      kpi.name,
      kpi.weightUnits,
    ])
  );

  return crypto
    .createHash("sha256")
    .update(canonicalJson)
    .digest("hex");
}