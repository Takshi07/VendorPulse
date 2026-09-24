import assert from "node:assert/strict";
import test from "node:test";

import reportRoutes from "../src/routes/reportRoutes.js";
import {
  buildEvaluationPdfReportModel,
  createEvaluationPdfFilename,
  createEvaluationPdfReport,
} from "../src/reports/evaluationPdfReport.js";
import { buildReportFilter } from "../src/services/reportService.js";

const fixtureEvaluations = [
  {
    _id: "evaluation-internal-id-1",
    supplierId: {
      _id: "supplier-internal-id-1",
      supplierName: "Nova Supplies",
      category: "Components",
    },
    evaluatorId: {
      _id: "user-internal-id-1",
      name: "Admin User",
    },
    year: 2026,
    quarter: 3,
    criteriaSignature: "internal-criteria-signature-v1",
    overallScore: 4.2,
    performanceRating: "EXCELLENT",
    riskLevel: "LOW",
    createdAt: new Date("2026-08-20T08:30:00.000Z"),
    comments: "Consistent performance across the period.",
    scores: [
      {
        kpiId: "kpi-internal-id-quality",
        kpiNameSnapshot: "Historical Quality",
        weightSnapshot: 45,
        score: 4,
        comment: "Quality remained stable.",
      },
      {
        kpiId: "kpi-internal-id-delivery",
        kpiNameSnapshot: "Historical Delivery",
        weightSnapshot: 30,
        score: 5,
      },
    ],
  },
  {
    _id: "evaluation-internal-id-2",
    supplierId: {
      _id: "supplier-internal-id-2",
      supplierName: "Orion Industries",
      category: "Logistics",
    },
    evaluatorId: {
      _id: "user-internal-id-2",
      name: "Procurement Manager",
    },
    year: 2026,
    quarter: 3,
    criteriaSignature: "internal-criteria-signature-v1",
    overallScore: 3.85,
    performanceRating: "GOOD",
    riskLevel: "MODERATE",
    createdAt: new Date("2026-08-21T09:45:00.000Z"),
    scores: [
      {
        kpiId: "kpi-internal-id-quality",
        kpiNameSnapshot: "Historical Quality",
        weightSnapshot: 45,
        score: 3,
      },
      {
        kpiId: "kpi-internal-id-delivery",
        kpiNameSnapshot: "Historical Delivery",
        weightSnapshot: 30,
        score: 4,
      },
    ],
  },
];

function reportData(evaluations = fixtureEvaluations) {
  return {
    evaluations,
    scope: {
      supplierName: null,
      year: 2026,
      quarter: 3,
    },
  };
}

function responseRecorder() {
  return {
    statusCode: null,
    payload: null,
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    },
  };
}

test("PDF and CSV use the shared report filter validation", () => {
  const supplierId = "507f1f77bcf86cd799439011";

  assert.deepEqual(
    buildReportFilter({
      supplierId,
      year: "2026",
      quarter: "3",
    }),
    { supplierId, year: 2026, quarter: 3 }
  );
  assert.throws(
    () => buildReportFilter({ year: "not-a-year" }),
    /Year must be an integer/
  );
  assert.throws(
    () => buildReportFilter({ quarter: "5" }),
    /Quarter must be between 1 and 4/
  );
});

test("PDF model derives summaries and compatible KPI averages from evaluation snapshots", () => {
  const model = buildEvaluationPdfReportModel(
    reportData(),
    {
      generatedAt: new Date(
        "2026-09-24T05:00:00.000Z"
      ),
    }
  );

  assert.deepEqual(model.summary, {
    evaluationCount: 2,
    supplierCount: 2,
    averageScore: 4.025,
    highCriticalRiskCount: 0,
  });
  assert.deepEqual(model.ratingDistribution, {
    EXCELLENT: 1,
    GOOD: 1,
    NEEDS_IMPROVEMENT: 0,
    POOR: 0,
  });
  assert.deepEqual(model.riskDistribution, {
    LOW: 1,
    MODERATE: 1,
    HIGH: 0,
    CRITICAL: 0,
  });
  assert.equal(model.criteriaGroups.length, 1);
  assert.equal(
    model.criteriaGroups[0].kpis[0].name,
    "Historical Quality"
  );
  assert.equal(
    model.criteriaGroups[0].kpis[0].weight,
    45
  );
  assert.equal(
    model.criteriaGroups[0].kpis[0].averageScore,
    3.5
  );
});

test("PDF model separates incompatible criteria without exposing signatures or IDs", () => {
  const evaluations = structuredClone(fixtureEvaluations);
  evaluations[1].criteriaSignature =
    "internal-criteria-signature-v2";
  evaluations[1].scores[0].kpiNameSnapshot =
    "Historical Conformance";
  evaluations[1].scores[0].weightSnapshot = 50;

  const model = buildEvaluationPdfReportModel(
    reportData(evaluations)
  );
  const serialized = JSON.stringify(model);

  assert.equal(model.criteriaGroups.length, 2);
  assert.equal(
    model.criteriaGroups[1].label,
    "Criteria configuration 2"
  );
  assert.equal(
    model.criteriaGroups[1].kpis[0].name,
    "Historical Conformance"
  );
  assert.equal(serialized.includes("criteria-signature"), false);
  assert.equal(serialized.includes("internal-id"), false);
});

test("historical PDF content remains based on snapshots rather than current KPI definitions", () => {
  const currentKpi = {
    name: "Current Quality Name",
    weight: 10,
  };
  const model = buildEvaluationPdfReportModel(
    reportData([fixtureEvaluations[0]])
  );

  currentKpi.name = "Changed Again";
  currentKpi.weight = 90;

  assert.equal(
    model.evaluations[0].scores[0].name,
    "Historical Quality"
  );
  assert.equal(
    model.evaluations[0].scores[0].weight,
    45
  );
});

test("PDF renderer creates valid multi-record and empty PDF buffers", async () => {
  const generatedAt = new Date(
    "2026-09-24T05:00:00.000Z"
  );
  const multi = await createEvaluationPdfReport(
    reportData(),
    { generatedAt }
  );
  const empty = await createEvaluationPdfReport(
    reportData([]),
    { generatedAt }
  );

  assert.equal(
    multi.subarray(0, 5).toString("ascii"),
    "%PDF-"
  );
  assert.equal(
    empty.subarray(0, 5).toString("ascii"),
    "%PDF-"
  );
  assert.ok(multi.length > empty.length);
});

test("PDF renderer handles long supplier, KPI, and comment content", async () => {
  const evaluation = structuredClone(
    fixtureEvaluations[0]
  );
  evaluation.supplierId.supplierName =
    "Vendor with an intentionally long supplier name for wrapping and print layout verification";
  evaluation.scores[0].kpiNameSnapshot =
    "Historical product quality conformance and continuous improvement performance";
  evaluation.scores[0].comment =
    "Detailed KPI observation. ".repeat(18).trim();
  evaluation.comments =
    "Detailed overall evaluation commentary for management review. "
      .repeat(28)
      .trim();

  const pdf = await createEvaluationPdfReport(
    reportData([evaluation]),
    {
      generatedAt: new Date(
        "2026-09-24T05:00:00.000Z"
      ),
    }
  );

  assert.equal(
    pdf.subarray(0, 5).toString("ascii"),
    "%PDF-"
  );
  assert.ok(pdf.length > 5000);
});

test("PDF export route is authenticated and permits every reports role", () => {
  const authLayer = reportRoutes.stack[0].handle;
  const roleLayer = reportRoutes.stack[1].handle;
  const pdfRoute = reportRoutes.stack.find(
    (layer) =>
      layer.route?.path === "/evaluations.pdf"
  );
  const unauthenticatedResponse = responseRecorder();

  authLayer(
    { cookies: {} },
    unauthenticatedResponse,
    () => assert.fail("Unauthenticated request advanced")
  );
  assert.equal(unauthenticatedResponse.statusCode, 401);
  assert.equal(pdfRoute?.route?.methods?.get, true);

  for (const role of [
    "ADMIN",
    "PROCUREMENT_MANAGER",
    "VIEWER",
  ]) {
    let advanced = false;
    roleLayer(
      { user: { role } },
      responseRecorder(),
      () => {
        advanced = true;
      }
    );
    assert.equal(advanced, true);
  }
});

test("PDF filenames use readable safe report scope", () => {
  assert.equal(
    createEvaluationPdfFilename({
      supplierName: "Nova Supplies (West)",
      year: 2026,
      quarter: 3,
    }),
    "VendorPulse_Supplier_Performance_Nova_Supplies_West_Q3_2026.pdf"
  );
  assert.equal(
    createEvaluationPdfFilename({}),
    "VendorPulse_Supplier_Performance_All_Periods.pdf"
  );
});
