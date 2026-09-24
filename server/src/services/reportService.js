import mongoose from "mongoose";
import Evaluation from "../models/Evaluation.js";
import Supplier from "../models/Supplier.js";

const PDF_EXPORT_LIMIT = 500;

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function buildReportFilter({
  supplierId,
  year,
  quarter,
}) {
  const filter = {};

  if (supplierId) {
    if (!mongoose.isValidObjectId(supplierId)) {
      throw createError("Invalid supplier ID", 400);
    }

    filter.supplierId = supplierId;
  }

  if (year !== undefined) {
    const numericYear = Number(year);

    if (!Number.isInteger(numericYear)) {
      throw createError("Year must be an integer", 400);
    }

    filter.year = numericYear;
  }

  if (quarter !== undefined) {
    const numericQuarter = Number(quarter);

    if (![1, 2, 3, 4].includes(numericQuarter)) {
      throw createError(
        "Quarter must be between 1 and 4",
        400
      );
    }

    filter.quarter = numericQuarter;
  }

  return filter;
}

export async function getEvaluationReport({
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

  const filter = buildReportFilter({
    supplierId,
    year,
    quarter,
  });

  const skip = (pageNumber - 1) * limitNumber;

  const [evaluations, total] = await Promise.all([
    Evaluation.find(filter)
      .populate(
        "supplierId",
        "supplierName status category"
      )
      .populate(
        "evaluatorId",
        "name email"
      )
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
      totalPages: Math.ceil(
        total / limitNumber
      ),
    },
  };
}

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export async function getEvaluationReportCsv({
  supplierId,
  year,
  quarter,
} = {}) {
  const filter = buildReportFilter({
    supplierId,
    year,
    quarter,
  });

  const total = await Evaluation.countDocuments(
    filter
  );

  if (total > 10000) {
    throw createError(
      "Report contains more than 10000 rows. Apply narrower filters before exporting.",
      400
    );
  }

  const evaluations = await Evaluation.find(filter)
    .populate(
      "supplierId",
      "supplierName status category"
    )
    .populate(
      "evaluatorId",
      "name email"
    )
    .sort({ createdAt: -1 });

  const header = [
    "Supplier",
    "Category",
    "Year",
    "Quarter",
    "Overall Score",
    "Performance Rating",
    "Risk Level",
    "Evaluator",
    "Submitted At",
  ];

  const rows = evaluations.map(
    (evaluation) => [
      evaluation.supplierId?.supplierName ?? "",
      evaluation.supplierId?.category ?? "",
      evaluation.year,
      evaluation.quarter,
      evaluation.overallScore,
      evaluation.performanceRating,
      evaluation.riskLevel,
      evaluation.evaluatorId?.name ?? "",
      evaluation.createdAt?.toISOString() ?? "",
    ]
  );

  return [
    header,
    ...rows,
  ]
    .map((row) =>
      row.map(escapeCsv).join(",")
    )
    .join("\n");
}

export async function getEvaluationReportPdfData({
  supplierId,
  year,
  quarter,
} = {}) {
  const filter = buildReportFilter({
    supplierId,
    year,
    quarter,
  });

  const total = await Evaluation.countDocuments(
    filter
  );

  if (total > PDF_EXPORT_LIMIT) {
    throw createError(
      `PDF report contains more than ${PDF_EXPORT_LIMIT} evaluations. Apply narrower filters before exporting.`,
      400
    );
  }

  const [evaluations, selectedSupplier] =
    await Promise.all([
      Evaluation.find(filter)
        .populate(
          "supplierId",
          "supplierName status category"
        )
        .populate(
          "evaluatorId",
          "name"
        )
        .sort({ createdAt: -1 })
        .lean(),
      supplierId
        ? Supplier.findById(supplierId)
            .select("supplierName")
            .lean()
        : null,
    ]);

  return {
    evaluations,
    scope: {
      supplierName:
        selectedSupplier?.supplierName ?? null,
      year:
        year === undefined || year === ""
          ? null
          : Number(year),
      quarter:
        quarter === undefined || quarter === ""
          ? null
          : Number(quarter),
    },
  };
}
