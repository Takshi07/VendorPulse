import {
  PERFORMANCE_RATINGS,
  RISK_LEVELS,
} from "./constants.js";

export function calculateOverallScore(scores) {
  if (!Array.isArray(scores) || scores.length === 0) {
    throw new Error("At least one KPI score is required");
  }

  let weightedTotal = 0;
  let weightTotal = 0;

  for (const item of scores) {
    const score = Number(item.score);
    const weight = Number(item.weightSnapshot);

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new Error("Each KPI score must be a whole number from 1 to 5");
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      throw new Error("Each KPI weight must be greater than 0");
    }

    weightedTotal += score * weight;
    weightTotal += weight;
  }

  if (Math.abs(weightTotal - 100) > 0.000001) {
    throw new Error("KPI weights must total exactly 100%");
  }

  return Number((weightedTotal / 100).toFixed(2));
}

export function getPerformanceRating(overallScore) {
  if (
    !Number.isFinite(overallScore) ||
    overallScore < 1 ||
    overallScore > 5
  ) {
    throw new Error("Overall score must be between 1 and 5");
  }

  if (overallScore >= 4) {
    return PERFORMANCE_RATINGS.EXCELLENT;
  }

  if (overallScore >= 3) {
    return PERFORMANCE_RATINGS.GOOD;
  }

  if (overallScore >= 2) {
    return PERFORMANCE_RATINGS.NEEDS_IMPROVEMENT;
  }

  return PERFORMANCE_RATINGS.POOR;
}

export function getRiskLevel(overallScore) {
  if (
    !Number.isFinite(overallScore) ||
    overallScore < 1 ||
    overallScore > 5
  ) {
    throw new Error("Overall score must be between 1 and 5");
  }

  if (overallScore >= 4) {
    return RISK_LEVELS.LOW;
  }

  if (overallScore >= 3) {
    return RISK_LEVELS.MODERATE;
  }

  if (overallScore >= 2) {
    return RISK_LEVELS.HIGH;
  }

  return RISK_LEVELS.CRITICAL;
}
