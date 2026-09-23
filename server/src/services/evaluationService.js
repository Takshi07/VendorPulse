import mongoose from "mongoose";

import Supplier from "../models/Supplier.js";
import KPI from "../models/KPI.js";
import Evaluation from "../models/Evaluation.js";

import {
  calculateOverallScore,
  getPerformanceRating,
  getRiskLevel,
} from "../domain/evaluationRules.js";

import {
  SUPPLIER_STATUS,
  KPI_STATUS,
} from "../domain/constants.js";

import {
  validateActiveKpiWeights,
} from "../domain/kpiRules.js";

import {
  generateCriteriaSignature,
} from "../domain/criteriaSignature.js";

export async function getEvaluationConfig() {
  const [suppliers, kpis] = await Promise.all([
    Supplier.find({
      status: SUPPLIER_STATUS.ACTIVE,
    }).sort({ supplierName: 1 }),

    KPI.find({
      status: KPI_STATUS.ACTIVE,
    }).sort({ name: 1 }),
  ]);

  const weightValidation =
    validateActiveKpiWeights(kpis);

  const criteriaSignature =
    weightValidation.valid
      ? generateCriteriaSignature(kpis)
      : null;

  return {
    suppliers,
    kpis,
    totalActiveWeight: weightValidation.total,
    valid: weightValidation.valid,
    message: weightValidation.message,
    criteriaSignature,
  };
}

export async function createEvaluation(data, evaluatorId) {
  const {
    supplierId,
    year,
    quarter,
    criteriaSignature,
    scores,
    comments,
  } = data;

  // Basic request validation
  if (!mongoose.isValidObjectId(supplierId)) {
    const error = new Error("Invalid supplier ID");
    error.status = 400;
    throw error;
  }

  const numericYear = Number(year);
  const numericQuarter = Number(quarter);

  if (!Number.isInteger(numericYear)) {
    const error = new Error("Year must be an integer");
    error.status = 400;
    throw error;
  }

  if (![1, 2, 3, 4].includes(numericQuarter)) {
    const error = new Error("Quarter must be between 1 and 4");
    error.status = 400;
    throw error;
  }

  if (!criteriaSignature?.trim()) {
    const error = new Error("Criteria signature is required");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(scores) || scores.length === 0) {
    const error = new Error("KPI scores are required");
    error.status = 400;
    throw error;
  }
  if (
  comments !== undefined &&
  comments !== null
  ) {
      if (typeof comments !== "string") {
        const error = new Error(
          "Evaluation comments must be text"
        );
        error.status = 400;
        throw error;
      }

      if (comments.length > 2000) {
        const error = new Error(
          "Evaluation comments cannot exceed 2000 characters"
        );
        error.status = 400;
        throw error;
      }
    }

  // Supplier must exist and be ACTIVE
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
    const error = new Error("Supplier not found");
    error.status = 404;
    throw error;
    }

    if (supplier.status !== SUPPLIER_STATUS.ACTIVE) {
    const error = new Error("Archived suppliers cannot be evaluated");
    error.status = 400;
    throw error;
    }

    // Load the current ACTIVE KPI configuration
    const activeKpis = await KPI.find({
    status: KPI_STATUS.ACTIVE,
    });

    const weightValidation = validateActiveKpiWeights(activeKpis);

    if (!weightValidation.valid) {
    const error = new Error(weightValidation.message);
    error.status = 400;
    throw error;
    }

    // Make sure the form was created from the current KPI configuration
    const currentSignature = generateCriteriaSignature(activeKpis);

    if (criteriaSignature !== currentSignature) {
    const error = new Error(
        "Evaluation criteria changed. Reload the evaluation form."
    );
    error.status = 409;
    error.code = "CRITERIA_CHANGED";
    throw error;
    }

    // Exactly one submitted score per ACTIVE KPI
    if (scores.length !== activeKpis.length) {
    const error = new Error(
        "A score is required for every active KPI"
    );
    error.status = 400;
    throw error;
    }

    const activeKpiMap = new Map(
    activeKpis.map((kpi) => [
        kpi._id.toString(),
        kpi,
    ])
    );

    const submittedIds = new Set();

    for (const item of scores) {
    if (!mongoose.isValidObjectId(item.kpiId)) {
        const error = new Error("Invalid KPI ID");
        error.status = 400;
        throw error;
    }

    const kpiId = item.kpiId.toString();

    if (submittedIds.has(kpiId)) {
        const error = new Error(
        "Duplicate KPI scores are not allowed"
        );
        error.status = 400;
        throw error;
    }

    if (!activeKpiMap.has(kpiId)) {
        const error = new Error(
        "Submitted KPI does not match the active evaluation criteria"
        );
        error.status = 400;
        throw error;
    }

    if (
        !Number.isInteger(item.score) ||
        item.score < 1 ||
        item.score > 5
    ) {
        const error = new Error(
        "Each KPI score must be a whole number from 1 to 5"
        );
        error.status = 400;
        throw error;
    }

    if (
  item.comment !== undefined &&
  item.comment !== null
) {
  if (typeof item.comment !== "string") {
    const error = new Error(
      "KPI comment must be text"
    );
    error.status = 400;
    throw error;
  }

  if (item.comment.length > 500) {
    const error = new Error(
      "KPI comment cannot exceed 500 characters"
    );
    error.status = 400;
    throw error;
  }
}

    submittedIds.add(kpiId);
    }
    // Build trusted score snapshots from the current KPI configuration
    const scoreSnapshots = scores.map((item) => {
    const kpi = activeKpiMap.get(item.kpiId.toString());

    return {
        kpiId: kpi._id,
        kpiNameSnapshot: kpi.name,
        weightSnapshot: kpi.weight,
        score: item.score,
        comment: item.comment?.trim() || undefined,
    };
    });

    // Calculate the result on the server
    const overallScore = calculateOverallScore(scoreSnapshots);

    const performanceRating =
    getPerformanceRating(overallScore);

    const riskLevel =
    getRiskLevel(overallScore);

    // Store the immutable submitted evaluation
    const evaluation = await Evaluation.create({
    supplierId: supplier._id,
    evaluatorId,
    year: numericYear,
    quarter: numericQuarter,
    criteriaSignature: currentSignature,
    scores: scoreSnapshots,
    overallScore,
    performanceRating,
    riskLevel,
    comments: comments?.trim() || undefined,
    });

    return evaluation;
}

export async function listEvaluations({
  page = 1,
  limit = 10,
  supplierId,
  year,
  quarter,
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

  if (supplierId) {
    if (!mongoose.isValidObjectId(supplierId)) {
      const error = new Error("Invalid supplier ID");
      error.status = 400;
      throw error;
    }

    filter.supplierId = supplierId;
  }

  if (year !== undefined) {
    const numericYear = Number(year);

    if (!Number.isInteger(numericYear)) {
      const error = new Error("Year must be an integer");
      error.status = 400;
      throw error;
    }

    filter.year = numericYear;
  }

  if (quarter !== undefined) {
    const numericQuarter = Number(quarter);

    if (![1, 2, 3, 4].includes(numericQuarter)) {
      const error = new Error("Quarter must be between 1 and 4");
      error.status = 400;
      throw error;
    }

    filter.quarter = numericQuarter;
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [evaluations, total] = await Promise.all([
    Evaluation.find(filter)
      .populate("supplierId", "supplierName status")
      .populate("evaluatorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),

    Evaluation.countDocuments(filter),
  ]);

  return {
    evaluations,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

export async function getEvaluationById(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid evaluation ID");
    error.status = 400;
    throw error;
  }

  const evaluation = await Evaluation.findById(id)
    .populate("supplierId", "supplierName status category")
    .populate("evaluatorId", "name email");

  if (!evaluation) {
    const error = new Error("Evaluation not found");
    error.status = 404;
    throw error;
  }

  return evaluation;
}