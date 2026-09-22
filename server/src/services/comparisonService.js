import mongoose from "mongoose";
import Evaluation from "../models/Evaluation.js";

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function compareSuppliers({
  supplierIds,
  year,
  quarter,
}) {
  if (!supplierIds) {
    throw createError(
      "Select 2 or 3 suppliers to compare",
      400
    );
  }

  const ids = Array.isArray(supplierIds)
    ? supplierIds
    : supplierIds.split(",");

  const cleanIds = ids
    .map((id) => id.trim())
    .filter(Boolean);

  if (cleanIds.length < 2 || cleanIds.length > 3) {
    throw createError(
      "Exactly 2 or 3 suppliers are required",
      400
    );
  }

  if (new Set(cleanIds).size !== cleanIds.length) {
    throw createError(
      "Suppliers must be distinct",
      400
    );
  }

  if (
    cleanIds.some(
      (id) => !mongoose.isValidObjectId(id)
    )
  ) {
    throw createError("Invalid supplier ID", 400);
  }

  const numericYear = Number(year);
  const numericQuarter = Number(quarter);

  if (!Number.isInteger(numericYear)) {
    throw createError("Year must be an integer", 400);
  }

  if (![1, 2, 3, 4].includes(numericQuarter)) {
    throw createError(
      "Quarter must be between 1 and 4",
      400
    );
  }

  const evaluations = await Evaluation.find({
    supplierId: { $in: cleanIds },
    year: numericYear,
    quarter: numericQuarter,
  }).populate(
    "supplierId",
    "supplierName status category"
  );

  if (evaluations.length !== cleanIds.length) {
    const foundIds = new Set(
      evaluations.map((evaluation) =>
        evaluation.supplierId._id.toString()
      )
    );

    const missingSupplierIds = cleanIds.filter(
      (id) => !foundIds.has(id)
    );

    const error = createError(
      "Every selected supplier must have an evaluation for this period",
      400
    );

    error.code = "MISSING_EVALUATION";
    error.missingSupplierIds = missingSupplierIds;

    throw error;
  }

  const signatures = new Set(
    evaluations.map(
      (evaluation) => evaluation.criteriaSignature
    )
  );

  if (signatures.size !== 1) {
    const error = createError(
      "Selected evaluations use different KPI criteria and cannot be compared",
      409
    );

    error.code = "INCOMPATIBLE_CRITERIA";

    throw error;
  }

  const scoreMaps = evaluations.map((evaluation) => {
    const map = new Map();

    for (const score of evaluation.scores) {
      map.set(score.kpiId.toString(), score);
    }

    return map;
  });

  const referenceScores = evaluations[0].scores;

  const criteria = referenceScores.map(
    (referenceScore) => {
      const kpiId =
        referenceScore.kpiId.toString();

      return {
        kpiId,
        kpiName:
          referenceScore.kpiNameSnapshot,
        weight:
          referenceScore.weightSnapshot,

        scores: evaluations.map(
          (evaluation, index) => ({
            supplierId:
              evaluation.supplierId._id.toString(),

            supplierName:
              evaluation.supplierId.supplierName,

            score:
              scoreMaps[index].get(kpiId)?.score ??
              null,
          })
        ),
      };
    }
  );

  return {
    period: {
      year: numericYear,
      quarter: numericQuarter,
    },

    criteriaSignature:
      evaluations[0].criteriaSignature,

    suppliers: evaluations.map(
      (evaluation) => ({
        supplierId:
          evaluation.supplierId._id.toString(),

        supplierName:
          evaluation.supplierId.supplierName,

        overallScore:
          evaluation.overallScore,

        performanceRating:
          evaluation.performanceRating,

        riskLevel:
          evaluation.riskLevel,
      })
    ),

    criteria,
  };
}