import Supplier from "../models/Supplier.js";
import Evaluation from "../models/Evaluation.js";
import { SUPPLIER_STATUS } from "../domain/constants.js";

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function getDashboardData({ year, quarter }) {
  const numericYear = Number(year);
  const numericQuarter = Number(quarter);

  if (!Number.isInteger(numericYear)) {
    throw createError("Year must be an integer", 400);
  }

  if (![1, 2, 3, 4].includes(numericQuarter)) {
    throw createError("Quarter must be between 1 and 4", 400);
  }

  const periodFilter = {
    year: numericYear,
    quarter: numericQuarter,
  };

  const [
    activeSupplierCount,
    evaluatedSupplierCount,
    highCriticalCount,
    ratingAggregation,
    recentEvaluations,
  ] = await Promise.all([
    Supplier.countDocuments({
      status: SUPPLIER_STATUS.ACTIVE,
    }),

    Evaluation.countDocuments(periodFilter),

    Evaluation.countDocuments({
      ...periodFilter,
      riskLevel: { $in: ["HIGH", "CRITICAL"] },
    }),

    Evaluation.aggregate([
      {
        $match: periodFilter,
      },
      {
        $group: {
          _id: "$performanceRating",
          count: { $sum: 1 },
        },
      },
    ]),

    Evaluation.find(periodFilter)
      .populate(
        "supplierId",
        "supplierName status category"
      )
      .populate(
        "evaluatorId",
        "name email"
      )
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const ratingDistribution = {
    EXCELLENT: 0,
    GOOD: 0,
    NEEDS_IMPROVEMENT: 0,
    POOR: 0,
  };

  for (const item of ratingAggregation) {
    if (
      Object.prototype.hasOwnProperty.call(
        ratingDistribution,
        item._id
      )
    ) {
      ratingDistribution[item._id] = item.count;
    }
  }

  return {
    period: {
      year: numericYear,
      quarter: numericQuarter,
    },

    metrics: {
      activeSupplierCount,
      evaluatedSupplierCount,
      highCriticalCount,
    },

    ratingDistribution,
    recentEvaluations,
  };
}